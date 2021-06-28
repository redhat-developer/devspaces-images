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
	"io/ioutil"
	"path/filepath"
	"regexp"
	"testing"

	commonMock "github.com/eclipse/che-plugin-broker/common/mocks"
	"github.com/eclipse/che-plugin-broker/model"
	utilMock "github.com/eclipse/che-plugin-broker/utils/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gopkg.in/yaml.v2"
)

type mocks struct {
	commonBroker *commonMock.Broker
	ioUtils      *utilMock.IoUtil
	rand         *commonMock.Random
	broker       *Broker
}

func initMocks() *mocks {
	commonBroker := &commonMock.Broker{}
	ioUtils := &utilMock.IoUtil{}
	rand := &commonMock.Random{}

	commonBroker.On("PrintInfo", mock.AnythingOfType("string"))
	commonBroker.On("PrintInfoBuffer", mock.Anything)
	commonBroker.On("PrintDebug", mock.AnythingOfType("string"))
	commonBroker.On("PubFailed", mock.AnythingOfType("string"))
	commonBroker.On("PubLog", mock.AnythingOfType("string"))
	commonBroker.On("PubStarted")
	commonBroker.On("PrintPlan", mock.AnythingOfType("[]model.PluginMeta"))
	commonBroker.On("CloseConsumers")
	commonBroker.On("PubDone", mock.AnythingOfType("string"))

	return &mocks{
		commonBroker: commonBroker,
		ioUtils:      ioUtils,
		rand:         rand,
		broker: &Broker{
			Broker:           commonBroker,
			ioUtils:          ioUtils,
			rand:             rand,
			localhostSidecar: false,
		},
	}
}

func TestBroker_StartPublishesErrorOnFetchError(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return(nil, errors.New("Test error"))

	err := m.broker.Start([]model.PluginFQN{pluginFQNWithoutRegistry}, "http://defaultRegistry.com")

	expectedMessage := "Failed to download plugin meta: failed to fetch plugin meta.yaml from URL 'http://defaultRegistry.com/plugins/test-no-registry/1.0/meta.yaml': Test error"
	assert.EqualError(t, err, expectedMessage)
	m.commonBroker.AssertCalled(t, "PubFailed", expectedMessage)
	m.commonBroker.AssertCalled(t, "PubLog", expectedMessage)
	m.commonBroker.AssertNotCalled(t, "PubDone", mock.AnythingOfType("string"))
}

func TestBroker_StartPublishesErrorOnProcessError(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return([]byte(""), nil)

	err := m.broker.Start([]model.PluginFQN{pluginFQNWithoutRegistry}, "http://defaultRegistry.com")

	expectedMessage := "Plugin 'test-no-registry/1.0' is invalid. Field 'apiVersion' must be present"
	assert.EqualError(t, err, expectedMessage)
	m.commonBroker.AssertCalled(t, "PubFailed", expectedMessage)
	m.commonBroker.AssertCalled(t, "PubLog", expectedMessage)
	m.commonBroker.AssertNotCalled(t, "PubDone", mock.AnythingOfType("string"))
	m.commonBroker.AssertCalled(t, "CloseConsumers")
}

func TestBroker_StartPublishesResults(t *testing.T) {
	pluginMetaContent := `
type: Che Plugin
apiVersion: v2
spec:
  containers:
    - name: che-machine-exec
      image: "docker.io/eclipse/che-machine-exec:next"
`
	m := initMocks()
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return([]byte(pluginMetaContent), nil)

	err := m.broker.Start([]model.PluginFQN{pluginFQNWithoutRegistry}, "http://defaultRegistry.com")

	assert.Nil(t, err)
	m.commonBroker.AssertNotCalled(t, "PubFailed", mock.AnythingOfType("string"))
	m.commonBroker.AssertNotCalled(t, "PubLog", mock.AnythingOfType("string"))
	m.commonBroker.AssertCalled(t, "PubDone", mock.AnythingOfType("string"))
	m.commonBroker.AssertCalled(t, "CloseConsumers")
}

func TestBroker_ProcessPluginsValidatesPlugins(t *testing.T) {
	// Plugin should always fail to validate
	metas := []model.PluginMeta{
		model.PluginMeta{
			ID: "testId",
		},
	}
	m := initMocks()
	_, err := m.broker.ProcessPlugins(metas)

	assert.Error(t, err)
	assert.Regexp(t, regexp.MustCompile("Plugin .* is invalid."), err)
}

func TestBroker_ProcessPluginsGetsRuntimeInjection(t *testing.T) {
	theiaMeta := loadPluginMetaFromFile(t, "theia-invalid-injection.yaml")
	metas := []model.PluginMeta{*theiaMeta}
	m := initMocks()
	_, err := m.broker.ProcessPlugins(metas)

	assert.Error(t, err)
	assert.Regexp(t, regexp.MustCompile("Unable to find"), err)
}

func TestBroker_ProcessPluginsProcessesAllPlugins(t *testing.T) {
	theiaMeta := loadPluginMetaFromFile(t, "theia-7.4.0.yaml")
	machineExecMeta := loadPluginMetaFromFile(t, "machine-exec-7.4.0.yaml")
	metas := []model.PluginMeta{*theiaMeta, *machineExecMeta}

	m := initMocks()
	plugins, err := m.broker.ProcessPlugins(metas)

	assert.Nil(t, err)
	assert.Equal(t, len(plugins), 2)
	assertListContainsPluginID(t, plugins, theiaMeta.ID)
}

// TestBroker_ProcessPluginAddsPluginRunnerRequirementsForVsCodePlugin is a high-level
// test to ensure broker attempts to add sidecar plugin runner requirements for vscode plugins.
// Full testing of plugin runner provisioning is in corresponding file.
func TestBroker_ProcessPluginAddsPluginRunnerRequirementsForVsCodePlugin(t *testing.T) {
	javaMeta := loadPluginMetaFromFile(t, "vscode-java-0.50.0.yaml")

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*javaMeta, nil)

	assert.NotNil(t, plugin)
	assert.Conditionf(t, func() (success bool) {
		for _, volume := range plugin.Containers[0].Volumes {
			if volume.Name == "plugins" {
				return true
			}
		}
		return false
	}, "AddPlugin should add plugin runner requirements for plugin runner")
}

// TestBroker_ProcessPluginDoesNotAddRunnerRequirementsForChePluginType is a high-level
// test to ensure broker does not add sidecar plugin runner requirements for Che plugins.
// Full testing of plugin runner provisioning is in corresponding file.
func TestBroker_ProcessPluginDoesNotAddRunnerRequirementsForChePluginType(t *testing.T) {
	machineExecMeta := loadPluginMetaFromFile(t, "machine-exec-7.4.0.yaml")

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*machineExecMeta, nil)

	assert.Equal(t, plugin, ConvertMetaToPlugin(*machineExecMeta))
}

// TestBroker_ProcessPluginDoesNotAddRunnerRequirementsForVsCodePluginWithNoContainers is a high-level
// test to ensure broker does not add sidecar plugin runner requirements for plugins
// with no containers.
// Full testing of plugin runner provisioning is in corresponding file.
func TestBroker_ProcessPluginDoesNotAddRunnerRequirementsForVsCodePluginWithNoContainers(t *testing.T) {
	noContainerMeta := loadPluginMetaFromFile(t, "vscode-java-no-containers.yaml")

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*noContainerMeta, nil)

	assert.Equal(t, plugin, ConvertMetaToPlugin(*noContainerMeta))
}

// TestBroker_ProcessPluginsInjectsRemoteRuntimeForVsCodePlugins is a high-level
// test to ensure plugin processing injects the remote theia runtime for VS Code plugins
// Full testing of runtime injection is in corresponding file.

func TestBroker_ProcessPluginsInjectsRemoteRuntimeForVsCodePlugins(t *testing.T) {
	javaMeta := loadPluginMetaFromFile(t, "vscode-java-0.50.0.yaml")
	injection := &RemotePluginInjection{
		Volume: model.Volume{
			Name: "testVol",
		},
		Env: model.EnvVar{
			Name: "testEnvVar",
		},
	}

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*javaMeta, injection)

	assert.Conditionf(t, func() (success bool) {
		hasVolume := false
		hasEnvVar := false
		for _, volume := range plugin.Containers[0].Volumes {
			if volume.Name == "testVol" {
				hasVolume = true
			}
		}
		for _, envVar := range plugin.Containers[0].Env {
			if envVar.Name == "testEnvVar" {
				hasEnvVar = true
			}
		}
		return hasVolume && hasEnvVar
	}, "Plugin should have remote runtime injected")
}

// TestBroker_ProcessPluginDoesNotInjectRuntimeForChePluginType is a high-level
// test to ensure broker does not inject the remote binary runtime for Che plugins.
// Full testing of runtime injection is in corresponding file.
func TestBroker_ProcessPluginDoesNotInjectRuntimeForChePluginType(t *testing.T) {
	machineExecMeta := loadPluginMetaFromFile(t, "machine-exec-7.4.0.yaml")
	injection := &RemotePluginInjection{
		Volume: model.Volume{
			Name: "testVol",
		},
		Env: model.EnvVar{
			Name: "testEnvVar",
		},
	}

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*machineExecMeta, injection)

	assert.Equal(t, plugin, ConvertMetaToPlugin(*machineExecMeta))
}

// TestBroker_ProcessPluginDoesNotAddRunnerRequirementsForVsCodePluginWithNoContainers is a high-level
// test to ensure broker does not inject the remote binary runtime for plugins with no containers
// Full testing of runtime injection is in corresponding file.
func TestBroker_ProcessPluginDoesNotInjectRuntimeForVsCodePluginWithNoContainers(t *testing.T) {
	noContainerMeta := loadPluginMetaFromFile(t, "vscode-java-no-containers.yaml")
	injection := &RemotePluginInjection{
		Volume: model.Volume{
			Name: "testVol",
		},
		Env: model.EnvVar{
			Name: "testEnvVar",
		},
	}

	m := initMocks()
	m.rand.On("IntFromRange", 4000, 10000).Return(4242)
	m.rand.On("String", 10).Return("randomString1234567890")
	m.rand.On("String", 6).Return("randomString123456")

	plugin := m.broker.ProcessPlugin(*noContainerMeta, injection)

	assert.Equal(t, plugin, ConvertMetaToPlugin(*noContainerMeta))
}

func loadPluginMetaFromFile(t *testing.T, filename string) *model.PluginMeta {
	path := filepath.Join("../testdata", filename)
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var pluginMeta model.PluginMeta
	if err := yaml.Unmarshal(bytes, &pluginMeta); err != nil {
		t.Fatal(err)
	}
	return &pluginMeta
}

func assertListContainsPluginID(t *testing.T, plugins []model.ChePlugin, id string) {
	found := false
	for _, plugin := range plugins {
		if plugin.ID == id {
			found = true
			break
		}
	}
	assert.True(t, found, "Expected to find plugin with id %s in list of plugins, but list is\n%v", plugins)
}

var pluginFQNWithoutRegistry = model.PluginFQN{
	ID: "test-no-registry/1.0",
}
