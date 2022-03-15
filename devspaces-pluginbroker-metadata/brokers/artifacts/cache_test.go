//
// Copyright (c) 2018-2020 Red Hat, Inc.
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
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSyncWithPluginsDirPrintsErrorWhenUnableToRead(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("ReadFile", mock.Anything).Return(nil, fmt.Errorf("test error"))
	m.ioUtils.On("GetFilesByGlob", mock.Anything).Return([]string{"test_file"}, nil)
	m.ioUtils.On("RemoveAll", mock.Anything).Return(nil)

	m.broker.syncWithPluginsDir([]model.CachedPlugin{})

	m.commonBroker.AssertCalled(t, "PrintInfo", "Failed to get installed plugins")
	m.ioUtils.AssertCalled(t, "RemoveAll", "test_file")
}

func TestSyncWithPluginsDirDoesNotPrintOutputWhenFileNotExist(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("ReadFile", mock.Anything).Return(nil, os.ErrNotExist)
	m.ioUtils.On("GetFilesByGlob", mock.Anything).Return([]string{"test_file"}, nil)
	m.ioUtils.On("RemoveAll", mock.Anything).Return(nil)

	m.broker.syncWithPluginsDir([]model.CachedPlugin{})

	m.commonBroker.AssertNotCalled(t, "PrintInfo", "Failed to get installed plugins")
	m.ioUtils.AssertCalled(t, "RemoveAll", "test_file")
}

func TestPreparePluginsToInstall(t *testing.T) {
	requested := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "", "2-newUrl", ""),
	}
	installed := []model.CachedPlugin{
		generateCachedPlugin(t, "3-removedPlugin", true, "3-removedUrl", "/3-dir/3-removedPath"),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "/2-dir/2-existingPath", "2-oldUrl", "/2-dir/2-removedPath"),
	}
	expected := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "/2-dir/2-existingPath", "2-newUrl", ""),
	}

	m := initMocks()
	m.ioUtils.On("RemoveAll", "/3-dir").Return(nil)
	m.ioUtils.On("RemoveFile", "/2-dir/2-removedPath").Return(nil)

	output := m.broker.preparePluginsToInstall(requested, installed)

	assert.NotNil(t, output)
	assert.ElementsMatch(t, output, expected)
	// Make sure removed extension from plugin 2-existingPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveFile", "/2-dir/2-removedPath")
	// Make sure entire directory for 3-removedPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveAll", "/3-dir")
}

func TestPreparePluginsToInstallIsRemoteMustMatchLocal(t *testing.T) {
	requested := []model.CachedPlugin{
		generateCachedPlugin(t, "testPlugin", true, "testUrl", ""),
	}
	installed := []model.CachedPlugin{
		generateCachedPlugin(t, "testPlugin", false, "testUrl", "/plugins/testExtension"),
	}

	m := initMocks()
	m.ioUtils.On("RemoveFile", "/plugins/testExtension").Return(nil)

	output := m.broker.preparePluginsToInstall(requested, installed)

	assert.NotNil(t, output)
	assert.ElementsMatch(t, output, requested)
	// Plugin should be removed if IsRemote does not match
	m.ioUtils.AssertCalled(t, "RemoveFile", "/plugins/testExtension")
}

func TestPreparePluginsToInstallIsRemoteMustMatchRemote(t *testing.T) {
	requested := []model.CachedPlugin{
		generateCachedPlugin(t, "testPlugin", false, "testUrl", ""),
	}
	installed := []model.CachedPlugin{
		generateCachedPlugin(t, "testPlugin", true, "testUrl", "/plugins/sidecars/testPlugin/testExtension"),
	}

	m := initMocks()
	m.ioUtils.On("RemoveAll", "/plugins/sidecars/testPlugin").Return(nil)

	output := m.broker.preparePluginsToInstall(requested, installed)

	assert.NotNil(t, output)
	assert.ElementsMatch(t, output, requested)
	// Plugin should be removed if IsRemote does not match
	m.ioUtils.AssertCalled(t, "RemoveAll", "/plugins/sidecars/testPlugin")
}

func TestPreparePluginsToInstallLogsErrorOnRemoveAll(t *testing.T) {
	testError := fmt.Errorf("test error)")

	requested := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "", "2-newUrl", ""),
	}
	installed := []model.CachedPlugin{
		generateCachedPlugin(t, "3-removedPlugin", true, "3-removedUrl", "/3-dir/3-removedPath"),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "/2-dir/2-existingPath", "2-oldUrl", "/2-dir/2-removedPath"),
	}
	expected := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", true, "2-existingUrl", "/2-dir/2-existingPath", "2-newUrl", ""),
	}

	m := initMocks()
	m.ioUtils.On("RemoveAll", "/3-dir").Return(testError)
	m.ioUtils.On("RemoveFile", "/2-dir/2-removedPath").Return(nil)

	output := m.broker.preparePluginsToInstall(requested, installed)

	assert.NotNil(t, output)
	assert.ElementsMatch(t, output, expected)
	// Make sure removed extension from plugin 2-existingPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveFile", "/2-dir/2-removedPath")
	// Make sure entire directory for 3-removedPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveAll", "/3-dir")
	m.commonBroker.AssertCalled(t, "PrintInfo", "WARN: failed to remove plugin artifacts: %s", testError)
}

func TestPreparePluginsToInstallLogsErrorOnRemoveFile(t *testing.T) {
	testError := fmt.Errorf("test error)")

	requested := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", false, "2-existingUrl", "", "2-newUrl", ""),
	}
	installed := []model.CachedPlugin{
		generateCachedPlugin(t, "3-removedPlugin", true, "3-removedUrl", "/3-dir/3-removedPath"),
		generateCachedPlugin(t, "2-existingPlugin", false, "2-existingUrl", "/2-dir/2-existingPath", "2-oldUrl", "/2-dir/2-removedPath"),
	}
	expected := []model.CachedPlugin{
		generateCachedPlugin(t, "1-newPlugin", false, "1-newUrl", ""),
		generateCachedPlugin(t, "2-existingPlugin", false, "2-existingUrl", "/2-dir/2-existingPath", "2-newUrl", ""),
	}

	m := initMocks()
	m.ioUtils.On("RemoveAll", "/3-dir").Return(nil)
	m.ioUtils.On("RemoveFile", "/2-dir/2-removedPath").Return(testError)

	output := m.broker.preparePluginsToInstall(requested, installed)

	assert.NotNil(t, output)
	assert.ElementsMatch(t, output, expected)
	// Make sure removed extension from plugin 2-existingPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveFile", "/2-dir/2-removedPath")
	// Make sure entire directory for 3-removedPlugin is removed
	m.ioUtils.AssertCalled(t, "RemoveAll", "/3-dir")
	m.commonBroker.AssertCalled(t, "PrintInfo", "WARN: Failed to clean up plugin at %s: %s", "/2-dir/2-removedPath", testError)
}

func TestReadInstalledPlugins(t *testing.T) {
	installedJSON, installedJSONBytes := generateInstalledPluginJSON(t, installedPluginsJSONVersion)

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(installedJSONBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(nil)
	m.ioUtils.On("FileExists", mock.Anything).Return(true)

	actual, err := m.broker.readInstalledPlugins()

	assert.Nil(t, err)
	assert.ElementsMatch(t, installedJSON.Plugins, actual)
	m.ioUtils.AssertCalled(t, "RemoveFile", installedPluginsJSONFile)
}

func TestReadInstalledPluginsFailureToReadFile(t *testing.T) {
	testError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(nil, testError)

	_, err := m.broker.readInstalledPlugins()

	assert.EqualError(t, err, "test error")
}

func TestReadInstalledPluginsFailureToRemoveFile(t *testing.T) {
	_, installedJSONBytes := generateInstalledPluginJSON(t, installedPluginsJSONVersion)
	testError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(installedJSONBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(testError)

	_, err := m.broker.readInstalledPlugins()

	assert.EqualError(t, err, "test error")
	m.ioUtils.AssertCalled(t, "RemoveFile", installedPluginsJSONFile)
}

func TestReadInstalledPluginsMalformedJSON(t *testing.T) {
	jsonBytes := []byte("{")

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(jsonBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(nil)

	_, err := m.broker.readInstalledPlugins()

	assert.NotNil(t, err)
	m.ioUtils.AssertCalled(t, "RemoveFile", installedPluginsJSONFile)
}

func TestReadInstalledPluginsDifferentVersion(t *testing.T) {
	_, installedJSONBytes := generateInstalledPluginJSON(t, "testVersion")

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(installedJSONBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(nil)

	_, err := m.broker.readInstalledPlugins()

	m.commonBroker.AssertCalled(t, "PrintInfo", "Installed plugins cache is incompatible with current version of plugin broker. All plugins will be redownloaded.")

	assert.EqualError(t, err, "Installed plugins list is from previous version of broker")
}

func TestReadInstalledPluginsChecksFiles(t *testing.T) {
	_, installedJSONBytes := generateInstalledPluginJSON(t, installedPluginsJSONVersion,
		generateCachedPlugin(t, "plugin1", false, "url1", "file1"),
		generateCachedPlugin(t, "plugin2", true, "url2", "file2", "url3", "file3"))

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(installedJSONBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(nil)
	m.ioUtils.On("FileExists", mock.Anything).Return(true)

	_, err := m.broker.readInstalledPlugins()
	assert.Nil(t, err)
	m.ioUtils.AssertCalled(t, "FileExists", "file1")
	m.ioUtils.AssertCalled(t, "FileExists", "file2")
	m.ioUtils.AssertCalled(t, "FileExists", "file3")
}

func TestReadInstalledPluginsChecksFilesPropagatesError(t *testing.T) {
	_, installedJSONBytes := generateInstalledPluginJSON(t, installedPluginsJSONVersion)

	m := initMocks()
	m.ioUtils.On("ReadFile", installedPluginsJSONFile).Return(installedJSONBytes, nil)
	m.ioUtils.On("RemoveFile", installedPluginsJSONFile).Return(nil)
	m.ioUtils.On("FileExists", mock.Anything).Return(false)

	_, err := m.broker.readInstalledPlugins()
	assert.NotNil(t, err)
}

func TestWriteInstalledPlugins(t *testing.T) {
	plugins := []model.CachedPlugin{
		model.CachedPlugin{
			ID:       "plugin1",
			IsRemote: true,
			CachedExtensions: map[string]string{
				"pluginUrl": "pluginExt",
			},
		},
		model.CachedPlugin{
			ID:       "plugin2",
			IsRemote: false,
			CachedExtensions: map[string]string{
				"firstPluginUrl":  "firstPluginExtension",
				"secondPluginUrl": "secondPluginExtension",
			},
		},
	}

	m := initMocks()
	m.ioUtils.On("WriteFile", mock.Anything, mock.Anything).Return(nil)

	err := m.broker.writeInstalledPlugins(plugins)

	assert.Nil(t, err)
	m.ioUtils.AssertNumberOfCalls(t, "WriteFile", 1)
	m.ioUtils.AssertCalled(t, "WriteFile", installedPluginsJSONFile, mock.MatchedBy(func(bytes []byte) bool {
		var installedJSON model.InstalledPluginJSON
		err := json.Unmarshal(bytes, &installedJSON)
		if err != nil {
			t.Fatal("Failed to unmarshal json")
		}
		if installedJSON.Version != installedPluginsJSONVersion {
			return false
		}
		return assert.ElementsMatch(t, installedJSON.Plugins, plugins)
	}))
}

func TestWriteInstalledPluginsErrorOnWriteFile(t *testing.T) {
	expectedError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("WriteFile", mock.Anything, mock.Anything).Return(expectedError)

	err := m.broker.writeInstalledPlugins([]model.CachedPlugin{})

	assert.EqualError(t, err, "test error")
}

func TestResetPluginsDirectory(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("GetFilesByGlob", mock.Anything).Return([]string{"file1", "file2"}, nil)
	m.ioUtils.On("RemoveAll", mock.AnythingOfType("string")).Return(nil)

	m.broker.resetPluginsDirectory()

	m.ioUtils.AssertCalled(t, "RemoveAll", "file1")
	m.ioUtils.AssertCalled(t, "RemoveAll", "file2")
}

func TestResetPluginsDirectoryFailureToGlob(t *testing.T) {
	testError := fmt.Errorf("test error")
	m := initMocks()
	m.ioUtils.On("GetFilesByGlob", mock.Anything).Return(nil, testError)
	m.ioUtils.On("RemoveAll", mock.AnythingOfType("string")).Return(nil)

	m.broker.resetPluginsDirectory()

	m.commonBroker.AssertCalled(t, "PrintInfo", "WARN: failed to clear /plugins directory. Error: %s", testError)
}

func TestResetPluginsDirectoryFailureToRemove(t *testing.T) {
	testError := fmt.Errorf("test error")
	m := initMocks()
	m.ioUtils.On("GetFilesByGlob", mock.Anything).Return([]string{"file1", "file2"}, nil)
	m.ioUtils.On("RemoveAll", mock.AnythingOfType("string")).Return(testError)

	m.broker.resetPluginsDirectory()

	m.ioUtils.AssertCalled(t, "RemoveAll", "file1")
	m.ioUtils.AssertCalled(t, "RemoveAll", "file2")
	m.commonBroker.AssertCalled(t, "PrintInfo", "WARN: failed to remove '%s'. Error: %s", "file1", testError)
	m.commonBroker.AssertCalled(t, "PrintInfo", "WARN: failed to remove '%s'. Error: %s", "file2", testError)
}

func TestPreparePluginsRemoveLocalDoesNotAffectOthers(t *testing.T) {
	localPlugin := generateCachedPlugin(t, "test/local", false,
		"test.local1.url", "/plugins/testlocal_1",
		"test.local2.url", "/plugins/testlocal_2")
	removedLocalPlugin := generateCachedPlugin(t, "test/local_removed", false,
		"test.local1.url.removed", "/plugins/testlocal_1_removed",
		"test.local2.url.removed", "/plugins/testlocal_2_removed")
	remotePlugin := generateCachedPlugin(t, "test/remote", true,
		"test.remote1.url", "/plugins/sidecars/remote/remote_1",
		"test.remote2.url", "/plugins/sidecars/remote/remote_2")
	removedRemotePlugin := generateCachedPlugin(t, "test/remote_removed", true,
		"test.remote1.url.removed", "/plugins/sidecars/remote_removed/remote_1",
		"test.remote2.url.removed", "/plugins/sidecars/remote_removed/remote_2")
	unaffectedPaths := []string{
		"/plugins/testlocal_1",
		"/plugins/testlocal_2",
		"/plugins/sidecars/remote/remote_1",
		"/plugins/sidecars/remote/remote_2",
	}

	tests := []struct {
		name      string
		installed []model.CachedPlugin
		requested []model.CachedPlugin
	}{
		{
			name:      "Remove local plugin",
			installed: []model.CachedPlugin{localPlugin, removedLocalPlugin, remotePlugin},
			requested: []model.CachedPlugin{localPlugin, remotePlugin},
		},
		{
			name:      "Remove remote plugin",
			installed: []model.CachedPlugin{localPlugin, remotePlugin, removedRemotePlugin},
			requested: []model.CachedPlugin{localPlugin, remotePlugin},
		},
		{
			name:      "Remove local and remote plugin",
			installed: []model.CachedPlugin{localPlugin, removedLocalPlugin, remotePlugin, removedRemotePlugin},
			requested: []model.CachedPlugin{localPlugin, remotePlugin},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := initMocks()
			m.ioUtils.On("RemoveFile", mock.Anything).Return(nil).Run(func(args mock.Arguments) {
				removedPath := args.String(0)
				assert.NotContainsf(t, removedPath, unaffectedPaths,
					"Remove should not remove file in other plugin %s", removedPath)
			})
			m.ioUtils.On("RemoveAll", mock.Anything).Return(nil).Run(func(args mock.Arguments) {
				removed := args.String(0)
				for _, unaffected := range unaffectedPaths {
					assert.Falsef(t, strings.HasPrefix(unaffected, removed),
						"Should not remove directory (%s) containing other plugin's extensions: %s", removed, unaffected)
				}
			})
			m.broker.preparePluginsToInstall(tt.requested, tt.installed)
		})
	}
}

func generateCachedPlugin(t *testing.T, ID string, isRemote bool, cached ...string) model.CachedPlugin {
	plugin := model.CachedPlugin{
		ID:               ID,
		IsRemote:         isRemote,
		CachedExtensions: make(map[string]string),
	}
	for i := 0; i < len(cached); i += 2 {
		plugin.CachedExtensions[cached[i]] = cached[i+1]
	}
	return plugin
}

func generateInstalledPluginJSON(t *testing.T, version string, plugins ...model.CachedPlugin) (model.InstalledPluginJSON, []byte) {
	if plugins == nil {
		plugins = []model.CachedPlugin{generateCachedPlugin(t, "TestPlugin", true, "testUrl", "testExt")}
	}
	pluginsJSON := model.InstalledPluginJSON{
		Version: version,
		Plugins: plugins,
	}
	pluginsJSONBytes, err := json.MarshalIndent(pluginsJSON, "", "  ")
	if err != nil {
		t.Fatal("Failed to marshal json")
	}
	return pluginsJSON, pluginsJSONBytes
}
