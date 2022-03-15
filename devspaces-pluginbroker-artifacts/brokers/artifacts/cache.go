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
	"path"
	"path/filepath"

	"github.com/eclipse/che-plugin-broker/model"
)

const installedPluginsJSONFile = "/plugins/installed.json"
const installedPluginsJSONVersion = "1.0"

// syncWithPluginsDir takes a list of requested plugins and resolves it against what is currently
// installed, returning a list of InstalledPlugins that need to be downloaded. Note that
// returned list may be partially filled, if e.g. only one of two extensions in a plugin
// need to be updated.
// Plugins that are out of date will be deleted from the local filesystem, and any extensions
// that are not included in the current requested plugins will be removed.
func (b *Broker) syncWithPluginsDir(requested []model.CachedPlugin) (toInstall []model.CachedPlugin) {
	installed, err := b.readInstalledPlugins()
	if err != nil {
		if !os.IsNotExist(err) {
			// If file does not exist, printing error is unnecessary.
			b.PrintDebug("Error encountered during reading installed plugins: %s", err)
			b.PrintInfo("Failed to get installed plugins")
		}
		// Unable to read -- default to wiping everything and installing all plugins
		b.resetPluginsDirectory()
		return requested
	}
	toInstall = b.preparePluginsToInstall(requested, installed)
	return toInstall
}

// preparePluginsToInstall will prepare the /plugins directory for installation and return a list of (partially-filled)
// plugins to be installed. Any plugins that are currently installed but not requested in the workspace will
// be removed from the filesystem.
func (b *Broker) preparePluginsToInstall(requested, installed []model.CachedPlugin) (toInstall []model.CachedPlugin) {
	toInstall = requested
	for _, plugin := range installed {
		match := findPlugin(plugin, requested)
		if match == nil {
			// Plugin has been uninstalled since last start
			b.PrintInfo("Uninstalling plugin: %s", plugin.ID)
			if err := b.removePlugin(plugin); err != nil {
				b.PrintInfo("WARN: failed to remove plugin artifacts: %s", err)
			}
			continue
		}
		for ext, path := range plugin.CachedExtensions {
			if _, ok := match.CachedExtensions[ext]; ok {
				// Extension is already downloaded, fill path in struct to avoid downloading later.
				match.CachedExtensions[ext] = path
			} else {
				// Downloaded plugin is not used in current workspace and must be removed.
				err := b.ioUtils.RemoveFile(path)
				if err != nil {
					b.PrintInfo("WARN: Failed to clean up plugin at %s: %s", path, err)
				}
			}
		}
	}
	return toInstall
}

func (b *Broker) readInstalledPlugins() ([]model.CachedPlugin, error) {
	bytes, err := b.ioUtils.ReadFile(installedPluginsJSONFile)
	if err != nil {
		return nil, err
	}
	err = b.ioUtils.RemoveFile(installedPluginsJSONFile)
	if err != nil {
		return nil, err
	}

	var pluginsJSON model.InstalledPluginJSON
	err = json.Unmarshal(bytes, &pluginsJSON)
	if err != nil {
		return nil, err
	}
	if pluginsJSON.Version != installedPluginsJSONVersion {
		b.PrintInfo("Installed plugins cache is incompatible with current version of plugin broker. All plugins will be redownloaded.")
		return nil, fmt.Errorf("Installed plugins list is from previous version of broker")
	}

	err = b.checkInstalledPluginsFilePaths(pluginsJSON.Plugins)
	if err != nil {
		return nil, err
	}
	return pluginsJSON.Plugins, nil
}

func (b *Broker) checkInstalledPluginsFilePaths(installed []model.CachedPlugin) error {
	for _, plugin := range installed {
		for _, extension := range plugin.CachedExtensions {
			if !b.ioUtils.FileExists(extension) {
				return fmt.Errorf("unable to locate cached extension for plugin %s", plugin.ID)
			}
		}
	}
	return nil
}

func (b *Broker) writeInstalledPlugins(cached []model.CachedPlugin) error {
	b.PrintInfo("Saving log of installed plugins")
	cachedJSON := model.InstalledPluginJSON{
		Version: installedPluginsJSONVersion,
		Plugins: cached,
	}
	bytes, err := json.MarshalIndent(cachedJSON, "", "  ")
	if err != nil {
		return err
	}
	err = b.ioUtils.WriteFile(installedPluginsJSONFile, bytes)
	return err
}

func (b *Broker) removePlugin(plugin model.CachedPlugin) error {
	if plugin.IsRemote {
		// remote plugins have a subdirectory in /plugins/sidecars
		for _, extPath := range plugin.CachedExtensions {
			dir := path.Dir(extPath)
			return b.ioUtils.RemoveAll(dir)
		}
	} else {
		// non-remote plugins are stored in /plugins as single files
		for _, extPath := range plugin.CachedExtensions {
			return b.ioUtils.RemoveFile(extPath)
		}
	}
	return nil
}

func (b *Broker) resetPluginsDirectory() {
	b.PrintInfo("Cleaning /plugins dir")
	files, err := b.ioUtils.GetFilesByGlob(filepath.Join("/plugins", "*"))
	if err != nil {
		// Send log about clearing failure but proceed.
		// We might want to change this behavior later
		b.PrintInfo("WARN: failed to clear /plugins directory. Error: %s", err)
		return
	}

	for _, file := range files {
		err = b.ioUtils.RemoveAll(file)
		if err != nil {
			b.PrintInfo("WARN: failed to remove '%s'. Error: %s", file, err)
		}
	}
}

func findPlugin(query model.CachedPlugin, plugins []model.CachedPlugin) *model.CachedPlugin {
	for _, plugin := range plugins {
		// Note we need to ensure IsRemote matches, since remote plugins are handled
		// differently
		if plugin.ID == query.ID && plugin.IsRemote == query.IsRemote {
			return &plugin
		}
	}
	return nil
}
