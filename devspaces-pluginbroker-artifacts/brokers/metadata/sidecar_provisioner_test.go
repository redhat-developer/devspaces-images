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
	"testing"

	commonMock "github.com/eclipse/che-plugin-broker/common/mocks"
	"github.com/eclipse/che-plugin-broker/model"
	"github.com/eclipse/che-plugin-broker/utils"
	"github.com/stretchr/testify/assert"
)

const (
	testPort           = 4040
	testPortStr        = "4040"
	testEndpoint       = "newTestEndpoint"
	testEndpointEnvVar = "ws://" + testEndpoint + ":" + testPortStr
	pluginName         = "testPlugin"
	pluginPublisher    = "testPublisher"
	pluginVersion      = "testVersion"
	containerName      = "testContainer"
	containerImage     = "testImage"
)

func TestAddPluginRunnerRequirementsWithoutLocalHostSidecar(t *testing.T) {
	meta := model.PluginMeta{
		Name:      pluginName,
		Publisher: pluginPublisher,
		Version:   pluginVersion,
		Spec: model.PluginMetaSpec{
			Containers: []model.Container{
				{
					Name:         containerName,
					Image:        containerImage,
					MountSources: false,
				},
			},
		},
	}

	uniqueName := utils.GetPluginUniqueName(meta)
	expectedMeta := model.PluginMeta{
		Name:      pluginName,
		Publisher: pluginPublisher,
		Version:   pluginVersion,
		Spec: model.PluginMetaSpec{
			Containers: []model.Container{
				{
					Name:         containerName,
					Image:        containerImage,
					MountSources: true,
					Volumes: []model.Volume{
						{Name: sidecarVolumeName, MountPath: sidecarVolumeMountPath},
					},
					Ports: []model.ExposedPort{
						{ExposedPort: 4040},
					},
					Env: []model.EnvVar{
						{Name: theiaEndpointPortEnvVar, Value: testPortStr},
						{Name: theiaPluginsEnvVar, Value: pluginsPathBase + uniqueName},
					},
				},
			},
			Endpoints: []model.Endpoint{
				{Name: testEndpoint, TargetPort: testPort},
			},
			WorkspaceEnv: []model.EnvVar{
				{Name: remoteEndpointBase + uniqueName, Value: testEndpointEnvVar},
			},
		},
	}

	rand := &commonMock.Random{}
	rand.On("String", 10).Return(testEndpoint)
	rand.On("IntFromRange", 4000, 10000).Return(testPort)

	actualMeta := AddPluginRunnerRequirements(meta, rand, false)

	assert.Equal(t, expectedMeta, actualMeta)
}

func TestAddPluginRunnerRequirementsWithLocalHostSidecar(t *testing.T) {
	meta := model.PluginMeta{
		Name:      pluginName,
		Publisher: pluginPublisher,
		Version:   pluginVersion,
		Spec: model.PluginMetaSpec{
			Containers: []model.Container{
				{
					Name:         containerName,
					Image:        containerImage,
					MountSources: false,
				},
			},
		},
	}

	uniqueName := utils.GetPluginUniqueName(meta)
	expectedMeta := model.PluginMeta{
		Name:      pluginName,
		Publisher: pluginPublisher,
		Version:   pluginVersion,
		Spec: model.PluginMetaSpec{
			Containers: []model.Container{
				{
					Name:         containerName,
					Image:        containerImage,
					MountSources: true,
					Volumes: []model.Volume{
						{Name: sidecarVolumeName, MountPath: sidecarVolumeMountPath},
					},
					Env: []model.EnvVar{
						{Name: theiaPluginsEnvVar, Value: pluginsPathBase + uniqueName},
					},
				},
			},
		},
	}

	actualMeta := AddPluginRunnerRequirements(meta, nil, true)

	assert.Equal(t, expectedMeta, actualMeta)
}
