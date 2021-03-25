//
// Copyright (c) 2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package mergeplugins

import (
	"errors"
	"fmt"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/eclipse/che-plugin-broker/utils"
	"k8s.io/apimachinery/pkg/api/resource"
)

type containerResources struct {
	memLimit   *resource.Quantity
	memRequest *resource.Quantity
	cpuLimit   *resource.Quantity
	cpuRequest *resource.Quantity
}

func newResources() containerResources {
	r := containerResources{}
	r.memLimit = resource.NewQuantity(0, resource.DecimalSI)
	r.memRequest = resource.NewQuantity(0, resource.DecimalSI)
	r.cpuLimit = resource.NewQuantity(0, resource.DecimalSI)
	r.cpuRequest = resource.NewQuantity(0, resource.DecimalSI)
	return r
}

// MergePlugins collapses a list of plugins by merging any plugins that share the same container into
// a single plugin with multiple extensions
func MergePlugins(plugins []model.PluginMeta) ([]model.PluginMeta, []string) {
	var unmodified []model.PluginMeta
	var logBuf []string
	toMerge := map[string][]model.PluginMeta{}
	for _, plugin := range plugins {
		if !pluginMergable(plugin) {
			unmodified = append(unmodified, plugin)
			continue
		}
		pluginImage := plugin.Spec.Containers[0].Image
		toMerge[pluginImage] = append(toMerge[pluginImage], plugin)
	}

	var merged []model.PluginMeta
	for image, plugins := range toMerge {
		// Merging single plugins doesn't make sense
		if len(plugins) == 1 {
			unmodified = append(unmodified, plugins...)
			continue
		}
		logBuf = append(logBuf, fmt.Sprintf("Merging plugins [%s] to image %s", formatPluginNames(plugins), image))
		mergedPlugin, err := mergePluginsForImage(image, plugins)
		if err != nil {
			logBuf = append(logBuf, fmt.Sprintf("  Cannot merge plugins: %s", err))
			unmodified = append(unmodified, plugins...)
			continue
		}
		merged = append(merged, *mergedPlugin)
	}

	return append(unmodified, merged...), logBuf
}

func mergePluginsForImage(image string, plugins []model.PluginMeta) (*model.PluginMeta, error) {
	merged := &model.PluginMeta{
		APIVersion: "v2",
		Version:    plugins[0].Version,
		Name:       plugins[0].Name,
		Publisher:  plugins[0].Publisher,
		Type:       model.TheiaPluginType,
	}
	merged.ID = fmt.Sprintf("%s/%s/%s", merged.Publisher, merged.Name, merged.Version)

	container := model.Container{
		Name:  "merged-" + utils.SanitizeImage(image),
		Image: image,
	}

	resources := newResources()

	for _, plugin := range plugins {

		err := addEnv(merged, plugin)
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		err = addEndpoints(merged, plugin)
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		err = addContainerEnv(&container, plugin.Spec.Containers[0])
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		err = addResources(&resources, plugin.Spec.Containers[0])
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		err = addCommands(&container, plugin)
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		// Note: volumes differing in only their name will still be merged; the first volume will
		// decide the new volume's name
		err = addVolumes(&container, plugin)
		if err != nil {
			return nil, fmt.Errorf("failed to merge plugins on plugin %s: %w", plugin.Name, err)
		}

		addExtensions(merged, plugin)

		// Ports may collide but multiple plugins listening on the same port is already a failure,
		// even without merging, so we'll let it fail normally
		container.Ports = append(container.Ports, plugin.Spec.Containers[0].Ports...)

		if plugin.Spec.Containers[0].MountSources {
			container.MountSources = true
		}
	}

	setContainerResources(&container, resources)
	merged.Spec.Containers = []model.Container{container}

	return merged, nil
}

func addEnv(merged *model.PluginMeta, toMerge model.PluginMeta) error {

	for _, env := range toMerge.Spec.WorkspaceEnv {
		merge, fail := envMergeable(env, merged.Spec.WorkspaceEnv)
		if fail {
			return fmt.Errorf("different values for workspace environment variable %s", env.Name)
		}
		if merge {
			merged.Spec.WorkspaceEnv = append(merged.Spec.WorkspaceEnv, env)
		}
	}
	return nil
}

func addEndpoints(merged *model.PluginMeta, toMerge model.PluginMeta) error {
	for _, endpoint := range toMerge.Spec.Endpoints {
		merge, fail := endpointMergeable(endpoint, merged.Spec.Endpoints)
		if fail {
			return fmt.Errorf("conflicting endpoints: %s", endpoint.Name)
		}
		if merge {
			merged.Spec.Endpoints = append(merged.Spec.Endpoints, endpoint)
		}
	}
	return nil
}

func addContainerEnv(container *model.Container, toMerge model.Container) error {
	for _, env := range toMerge.Env {
		merge, fail := envMergeable(env, container.Env)
		if fail {
			return fmt.Errorf("different values for container environment variable %s", env.Name)
		}
		if merge {
			container.Env = append(container.Env, env)
		}
	}
	return nil
}

func addResources(resources *containerResources, container model.Container) error {
	if container.MemoryLimit != "" {
		memLimit, err := resource.ParseQuantity(container.MemoryLimit)
		if err != nil {
			return fmt.Errorf("failed to parse memory limit: %w", err)
		} else {
			resources.memLimit.Add(memLimit)
		}
	}

	if container.MemoryRequest != "" {
		memRequest, err := resource.ParseQuantity(container.MemoryRequest)
		if err != nil {
			return fmt.Errorf("failed to parse memory request: %w", err)
		} else {
			resources.memRequest.Add(memRequest)
		}
	}

	if container.CPULimit != "" {
		cpuLimit, err := resource.ParseQuantity(container.CPULimit)
		if err != nil {
			return fmt.Errorf("failed to parse cpu limit: %w", err)
		} else {
			resources.cpuLimit.Add(cpuLimit)
		}
	}

	if container.CPURequest != "" {
		cpuRequest, err := resource.ParseQuantity(container.CPURequest)
		if err != nil {
			return fmt.Errorf("failed to parse cpu request: %w", err)
		} else {
			resources.cpuRequest.Add(cpuRequest)
		}
	}

	return nil
}

func addCommands(container *model.Container, plugin model.PluginMeta) error {
	for _, pluginCommand := range plugin.Spec.Containers[0].Commands {
		merge, fail := commandMergeable(pluginCommand, container.Commands)
		if fail {
			return fmt.Errorf("command %s collides with another command in workspace", pluginCommand.Name)
		}
		if merge {
			container.Commands = append(container.Commands, pluginCommand)
		}
	}
	return nil
}

func addVolumes(container *model.Container, plugin model.PluginMeta) error {
	for _, volume := range plugin.Spec.Containers[0].Volumes {
		merge, fail, msg := volumeMergeable(volume, container.Volumes)
		if fail {
			return errors.New(msg)
		}
		if merge {
			container.Volumes = append(container.Volumes, volume)
		}
	}
	return nil
}

func addExtensions(merged *model.PluginMeta, toMerge model.PluginMeta) {
	for _, ext := range toMerge.Spec.Extensions {
		if !listContains(ext, merged.Spec.Extensions) {
			merged.Spec.Extensions = append(merged.Spec.Extensions, ext)
		}
	}
}

func setContainerResources(container *model.Container, resources containerResources) {
	if !resources.memLimit.IsZero() {
		container.MemoryLimit = resources.memLimit.String()
	}
	if !resources.memRequest.IsZero() {
		container.MemoryRequest = resources.memRequest.String()
	}
	if !resources.cpuLimit.IsZero() {
		container.CPULimit = resources.cpuLimit.String()
	}
	if !resources.cpuRequest.IsZero() {
		container.CPURequest = resources.cpuRequest.String()
	}
}

func formatPluginNames(plugins []model.PluginMeta) string {
	var names []string
	for _, plugin := range plugins {
		names = append(names, plugin.Name)
	}
	return strings.Join(names, ", ")
}

func listContains(test string, list []string) bool {
	for _, e := range list {
		if test == e {
			return true
		}
	}
	return false
}
