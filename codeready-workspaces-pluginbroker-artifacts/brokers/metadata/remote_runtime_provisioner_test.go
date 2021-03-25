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
	"regexp"
	"testing"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/stretchr/testify/assert"
)

func TestGetRuntimeInjectionNoCheTheiaEditor(t *testing.T) {
	metas := []model.PluginMeta{*loadPluginMetaFromFile(t, "vscode-java-0.50.0.yaml")}

	injection, err := GetRuntimeInjection(metas)

	assert.Nil(t, injection)
	assert.Nil(t, err)
}

func TestGetRuntimeInjectionNoContainerInjector(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Name = "Not-the-injector"

	metas := []model.PluginMeta{*meta}

	injection, err := GetRuntimeInjection(metas)

	assert.Nil(t, injection)
	assert.Nil(t, err)
}

func TestGetRuntimeInjectionGetsCorrectInjection(t *testing.T) {
	metas := []model.PluginMeta{*loadPluginMetaFromFile(t, "theia-7.4.0.yaml")}

	actualInjection, err := GetRuntimeInjection(metas)

	assert.Nil(t, err)

	expectedInjection := &RemotePluginInjection{
		Volume: model.Volume{
			MountPath: "/remote-endpoint",
			Name:      "remote-endpoint",
			Ephemeral: true,
		},
		Env: model.EnvVar{
			Name:  "PLUGIN_REMOTE_ENDPOINT_EXECUTABLE",
			Value: "/remote-endpoint/plugin-remote-endpoint",
		},
	}
	assert.Equal(t, expectedInjection, actualInjection)
}

func TestGetRuntimeInjectionErrorWhenNoRuntimeBinaryEnvVar(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Env = []model.EnvVar{
		{
			Name:  "REMOTE_ENDPOINT_VOLUME_NAME",
			Value: "remote-endpoint",
		},
	}
	metas := []model.PluginMeta{*meta}

	_, err := GetRuntimeInjection(metas)

	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("Unable to find required env with name"), err)
}

func TestGetRuntimeInjectionErrorWhenEmptyRuntimeBinaryEnvVar(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Env = []model.EnvVar{
		{
			Name:  "PLUGIN_REMOTE_ENDPOINT_EXECUTABLE",
			Value: "",
		},
		{
			Name:  "REMOTE_ENDPOINT_VOLUME_NAME",
			Value: "remote-endpoint",
		},
	}
	metas := []model.PluginMeta{*meta}

	_, err := GetRuntimeInjection(metas)

	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("Required env with name .* was found, but value is empty"), err)
}

func TestGetRuntimeInjectionErrorWhenNoVolumeNameEnvVar(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Env = []model.EnvVar{
		{
			Name:  "PLUGIN_REMOTE_ENDPOINT_EXECUTABLE",
			Value: "/remote-endpoint/plugin-remote-endpoint",
		},
	}
	metas := []model.PluginMeta{*meta}

	_, err := GetRuntimeInjection(metas)

	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("Unable to find required env with name"), err)
}

func TestGetRuntimeInjectionErrorWhenEmptyVolumeNameEnvVar(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Env = []model.EnvVar{
		{
			Name:  "PLUGIN_REMOTE_ENDPOINT_EXECUTABLE",
			Value: "/remote-endpoint/plugin-remote-endpoint",
		},
		{
			Name:  "REMOTE_ENDPOINT_VOLUME_NAME",
			Value: "",
		},
	}
	metas := []model.PluginMeta{*meta}

	_, err := GetRuntimeInjection(metas)

	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("Required env with name .* was found, but value is empty"), err)
}

func TestGetRuntimeInjectionWhenNoVolume(t *testing.T) {
	meta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	meta.Spec.InitContainers[0].Volumes = nil

	metas := []model.PluginMeta{*meta}

	_, err := GetRuntimeInjection(metas)

	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("Unable to find volume by name"), err)
}

func TestInjectRemoteRuntime(t *testing.T) {

	testVolume := model.Volume{
		MountPath: "testMountPoint",
		Name:      "testName",
		Ephemeral: true,
	}
	testEnvVar := model.EnvVar{
		Name:  "testEnvVarName",
		Value: "testEnvVarValue",
	}

	testInjection := &RemotePluginInjection{
		Volume: testVolume,
		Env:    testEnvVar,
	}

	plugin := constructPluginMeta()
	preEnvVar := plugin.Spec.Containers[0].Env[0]
	preVolume := plugin.Spec.Containers[0].Volumes[0]

	InjectRemoteRuntime(plugin, testInjection)

	// Ensure existing env var and volumes are unmodified
	assert.Contains(t, plugin.Spec.Containers[0].Env, preEnvVar)
	assert.Contains(t, plugin.Spec.Containers[0].Volumes, preVolume)

	assert.Contains(t, plugin.Spec.Containers[0].Env, testEnvVar)
	assert.Contains(t, plugin.Spec.Containers[0].Volumes, testVolume)
}

func TestInjectRemoteRuntimeEmptyInjection(t *testing.T) {

	plugin := constructPluginMeta()
	expected := constructPluginMeta()

	InjectRemoteRuntime(plugin, nil)

	assert.Equal(t, expected, plugin)
}

func constructPluginMeta() *model.PluginMeta {

	defaultVolume := model.Volume{
		MountPath: "defaultMountPath",
		Name:      "defaultName",
		Ephemeral: false,
	}
	defaultEnvVar := model.EnvVar{
		Name:  "defaultEnvVar",
		Value: "devaultEnvVarValue",
	}

	return &model.PluginMeta{
		Spec: model.PluginMetaSpec{
			Containers: []model.Container{
				{
					Env:     []model.EnvVar{defaultEnvVar},
					Volumes: []model.Volume{defaultVolume},
				},
			},
		},
	}
}
