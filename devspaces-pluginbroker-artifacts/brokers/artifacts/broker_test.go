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

package artifacts

import (
	"errors"
	"fmt"
	"io/ioutil"
	"path/filepath"
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
	// It doesn't seem to be possible to mock variadic arguments
	commonBroker.On("PrintInfo", mock.AnythingOfType("string"), mock.Anything)
	commonBroker.On("PrintInfo", mock.AnythingOfType("string"), mock.Anything, mock.Anything, mock.Anything)
	commonBroker.On("PrintInfoBuffer", mock.Anything)
	commonBroker.On("PrintDebug", mock.AnythingOfType("string"))
	commonBroker.On("PrintDebug", mock.AnythingOfType("string"), mock.Anything, mock.Anything, mock.Anything)
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
			Broker:  commonBroker,
			ioUtils: ioUtils,
			rand:    rand,
		},
	}
}

func TestStartFailsIfFetchFails(t *testing.T) {
	expectedError := errors.New("testError")
	expectedErrorString := fmt.Sprintf("Failed to download plugin meta: failed to fetch plugin meta.yaml from URL 'test/plugins/test/meta.yaml': %s", expectedError)
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("test", "test", ""),
	}

	m := initMocks()
	m.ioUtils.On("GetFilesByGlob", mock.AnythingOfType("string")).Return([]string{}, nil)
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return(nil, expectedError)

	err := m.broker.Start(pluginFQNs, "default.io")
	assert.EqualError(t, err, expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubFailed", expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubLog", expectedErrorString)
}

func TestFailureResolvingRelativeExtensionPaths(t *testing.T) {
	_, pluginMetaBytes := loadPluginMetaFromFile(t, "vscode-java-0.50.0-relative.yaml")
	defaultRegistry := ""
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("testRegistry", "testID", ""),
	}
	expectedErrorString := "cannot resolve relative extension path without default registry"

	m := initMocks()
	m.ioUtils.On("GetFilesByGlob", mock.AnythingOfType("string")).Return([]string{}, nil)
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return(pluginMetaBytes, nil)

	err := m.broker.Start(pluginFQNs, defaultRegistry)
	assert.EqualError(t, err, expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubFailed", expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubLog", expectedErrorString)
	m.commonBroker.AssertCalled(t, "CloseConsumers")
}

func TestStartPropagatesErrorOnPluginProcessing(t *testing.T) {
	_, pluginMetaBytes := loadPluginMetaFromFile(t, "vscode-java-0.50.0.yaml")
	defaultRegistry := ""

	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("testRegistry", "testID", ""),
	}
	expectedErrorString := "test error"

	m := initMocks()
	m.ioUtils.On("ReadFile", mock.AnythingOfType("string")).Return(nil, fmt.Errorf("Disabled for tests"))
	m.ioUtils.On("WriteFile", mock.AnythingOfType("string"), mock.Anything).Return(nil)
	m.ioUtils.On("RemoveFile", mock.AnythingOfType("string")).Return(nil)
	m.ioUtils.On("GetFilesByGlob", mock.AnythingOfType("string")).Return([]string{}, nil)
	m.ioUtils.On("Fetch", mock.AnythingOfType("string")).Return(pluginMetaBytes, nil)
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("", fmt.Errorf(expectedErrorString))

	err := m.broker.Start(pluginFQNs, defaultRegistry)
	assert.EqualError(t, err, expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubFailed", expectedErrorString)
	m.commonBroker.AssertCalled(t, "PubLog", expectedErrorString)
	m.commonBroker.AssertCalled(t, "CloseConsumers")
	// Make sure cached plugins file is not written
	m.ioUtils.AssertNotCalled(t, "WriteFile", mock.Anything, mock.Anything)
}

func TestStartSuccessfulFlow(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("ReadFile", mock.AnythingOfType("string")).Return(nil, fmt.Errorf("Disabled for tests"))
	m.ioUtils.On("WriteFile", mock.AnythingOfType("string"), mock.Anything).Return(nil)
	m.ioUtils.On("RemoveFile", mock.AnythingOfType("string")).Return(nil)
	m.ioUtils.On("GetFilesByGlob", mock.AnythingOfType("string")).Return([]string{}, nil)
	m.ioUtils.On("Fetch", "testRegistry/plugins/testID/meta.yaml").Return([]byte{}, nil)

	defaultRegistry := "default.io"
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("testRegistry", "testID", ""),
	}

	err := m.broker.Start(pluginFQNs, defaultRegistry)
	assert.Nil(t, err)

	m.commonBroker.AssertCalled(t, "PubStarted")
	m.commonBroker.AssertCalled(t, "PrintInfo", "Starting plugin artifacts broker")
	m.commonBroker.AssertCalled(t, "PrintInfo", "All plugin artifacts have been successfully downloaded")
	m.commonBroker.AssertCalled(t, "PubDone", "")
	m.commonBroker.AssertCalled(t, "CloseConsumers")
}

func TestConvertMetasToPluginsExcludesChePlugins(t *testing.T) {
	meta, _ := loadPluginMetaFromFile(t, "machine-exec-7.4.0.yaml")
	metas := []model.PluginMeta{meta}
	output := convertMetasToPlugins(metas)
	assert.Equal(t, 0, len(output))
}

func TestConvertMetasToPluginsConvertsRemoteVSCodePlugin(t *testing.T) {
	meta, _ := loadPluginMetaFromFile(t, "remote-vscode-ext.yaml")
	metas := []model.PluginMeta{meta}
	output := convertMetasToPlugins(metas)
	assert.Equal(t, 1, len(output))
	plugin := output[0]
	assert.Equal(t, meta.ID, plugin.ID)
	assert.True(t, plugin.IsRemote)
	assert.Equal(t, len(meta.Spec.Extensions), len(plugin.CachedExtensions))
	for _, ext := range meta.Spec.Extensions {
		assert.Contains(t, plugin.CachedExtensions, ext)
	}
}

func TestConvertMetasToPluginsConvertsNonRemoteVSCodePlugin(t *testing.T) {
	meta, _ := loadPluginMetaFromFile(t, "non-remote-vscode-ext.yaml")
	metas := []model.PluginMeta{meta}
	output := convertMetasToPlugins(metas)
	assert.Equal(t, 1, len(output))
	plugin := output[0]
	assert.Equal(t, meta.ID, plugin.ID)
	assert.False(t, plugin.IsRemote)
	assert.Equal(t, len(meta.Spec.Extensions), len(plugin.CachedExtensions))
	for _, ext := range meta.Spec.Extensions {
		assert.Contains(t, plugin.CachedExtensions, ext)
	}
}

func loadPluginMetaFromFile(t *testing.T, filename string) (model.PluginMeta, []byte) {
	path := filepath.Join("../testdata", filename)
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var pluginMeta model.PluginMeta
	if err := yaml.Unmarshal(bytes, &pluginMeta); err != nil {
		t.Fatal(err)
	}
	return pluginMeta, bytes
}

func generatePluginFQN(registry, id, reference string) model.PluginFQN {
	return model.PluginFQN{
		Registry:  registry,
		ID:        id,
		Reference: reference,
	}
}
