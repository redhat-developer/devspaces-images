//
// Copyright (c) 2019-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package metadata

import (
	"errors"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
)

const (
	cheTheiaEditorName = "che-theia"

	injectorContainerName = "remote-runtime-injector"

	remoteEndpointExecutableEnvVar = "PLUGIN_REMOTE_ENDPOINT_EXECUTABLE"
	volumeNameEnvVar               = "REMOTE_ENDPOINT_VOLUME_NAME"
)

// RemotePluginInjection contains the volume and environment variable
// that must be provisioned to a ChePlugin to allow it to load the remote
// plugin runtime.
type RemotePluginInjection struct {
	Volume model.Volume
	Env    model.EnvVar
}

// GetRuntimeInjection gets the volume and environment variable that must be
// provisioned in each VSCode or Theia plugin to allow it to start the remote
// plugin runtime.
func GetRuntimeInjection(metas []model.PluginMeta) (*RemotePluginInjection, error) {
	editorMeta := findCheTheiaEditor(metas)
	if editorMeta == nil {
		return nil, nil
	}
	containerInjector, err := findContainerInjector(editorMeta.Spec.InitContainers)
	if err != nil {
		// it's ok, older che-theia could be without runtime injection
		return nil, nil
	}

	runtimeBinaryPathEnv, err := findEnv(remoteEndpointExecutableEnvVar, containerInjector.Env)
	if err != nil {
		return nil, err
	}

	volumeName, err := findEnv(volumeNameEnvVar, containerInjector.Env)
	if err != nil {
		return nil, err
	}

	volume, err := findVolume(volumeName.Value, containerInjector.Volumes)
	if err != nil {
		return nil, err
	}

	return &RemotePluginInjection{
		Volume: *volume,
		Env:    *runtimeBinaryPathEnv,
	}, nil
}

// InjectRemoteRuntime adds require environment variable and volume to a ChePlugin
// to enable it to start the remote plugin runtime at start.
func InjectRemoteRuntime(meta *model.PluginMeta, injection *RemotePluginInjection) {
	if injection == nil {
		return
	}
	// sidecar container has one and only one container.
	container := &meta.Spec.Containers[0]

	container.Env = append(container.Env, injection.Env)
	container.Volumes = append(container.Volumes, injection.Volume)
}

func findCheTheiaEditor(metas []model.PluginMeta) *model.PluginMeta {
	for _, meta := range metas {
		if strings.ToLower(meta.Type) == model.EditorPluginType &&
			strings.ToLower(meta.Name) == cheTheiaEditorName &&
			len(meta.Spec.InitContainers) > 0 {
			return &meta
		}
	}
	// it's ok, maybe used some another editor instead of che-theia
	return nil
}

func findContainerInjector(containers []model.Container) (*model.Container, error) {
	for _, container := range containers {
		if container.Name == injectorContainerName {
			return &container, nil
		}
	}
	return nil, errors.New("Unable to find injector container")
}

func findEnv(envName string, envVars []model.EnvVar) (*model.EnvVar, error) {
	var result *model.EnvVar
	for _, envVar := range envVars {
		if envVar.Name == envName {
			result = &envVar
			break
		}
	}
	if result == nil {
		return nil, errors.New("Unable to find required env with name " + envName)
	}
	if result.Value == "" {
		return nil, errors.New("Required env with name " + envName + " was found, but value is empty")
	}

	return result, nil
}

func findVolume(volumeName string, volumes []model.Volume) (*model.Volume, error) {
	for _, volume := range volumes {
		if volume.Name == volumeName {
			return &volume, nil
		}
	}
	return nil, errors.New("Unable to find volume by name " + volumeName)
}
