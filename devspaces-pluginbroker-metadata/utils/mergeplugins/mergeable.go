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
	"fmt"
	"reflect"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
)

func pluginMergable(plugin model.PluginMeta) bool {
	pluginType := strings.ToLower(plugin.Type)
	if pluginType != model.TheiaPluginType && pluginType != model.VscodePluginType {
		return false
	}
	if len(plugin.Spec.Containers) != 1 {
		return false
	}
	container := plugin.Spec.Containers[0]
	if container.Command != nil || container.Args != nil {
		return false
	}
	if container.Lifecycle != nil {
		return false
	}

	// For now: don't deal with plugins that have initContainers for simplicity
	if len(plugin.Spec.InitContainers) > 0 {
		return false
	}

	return true
}

func envMergeable(env model.EnvVar, envList []model.EnvVar) (merge, fail bool) {
	for _, e := range envList {
		if e.Name == env.Name {
			if e.Value != env.Value {
				return false, true
			}
			return false, false
		}
	}
	return true, false
}

func endpointMergeable(endpoint model.Endpoint, endpointList []model.Endpoint) (merge, fail bool) {
	for _, e := range endpointList {
		if e.Name == endpoint.Name {
			if !reflect.DeepEqual(e, endpoint) {
				return false, true
			}
			return false, false
		}
	}
	return true, false
}

func commandMergeable(command model.Command, list []model.Command) (merge, fail bool) {
	for _, listCmd := range list {
		if command.Name == listCmd.Name {
			if command.WorkingDir == listCmd.WorkingDir && listsEqual(command.Command, listCmd.Command) {
				return false, false
			}
			return false, true
		}
	}
	return true, false
}

func volumeMergeable(volume model.Volume, list []model.Volume) (merge, fail bool, reason string) {
	for _, listVol := range list {
		if volume.MountPath == listVol.MountPath {
			if volume.Ephemeral == listVol.Ephemeral {
				return false, false, ""
			}
			return false, true, fmt.Sprintf("some volumes mounted to %s are ephemeral while others are not", volume.MountPath)
		}
		if volume.Name == listVol.Name {
			// Same name but different mountPath
			return false, true, fmt.Sprintf("volumes share name '%s' but have different mountPath", volume.Name)
		}
	}
	return true, false, ""
}

func listsEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for idx := range a {
		if a[idx] != b[idx] {
			return false
		}
	}
	return true
}
