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
	"fmt"
	"path/filepath"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/eclipse/che-plugin-broker/utils"
)

// ProcessPlugin downloads all undownloaded plugin extensions and places the
// relevant artifacts in their appropriate location in the /plugins directory.
// If a plugin already has artifacts downloaded for a given extension, that
// extension is skipped.
func (b *Broker) ProcessPlugin(plugin *model.CachedPlugin) error {
	workDir, err := b.ioUtils.TempDir("", "artifacts-broker")
	if err != nil {
		return err
	}

	// Workaround: messages can be displayed out of order in the workspace loading page
	// Collect messages in a buffer and print them as a single string when needed.
	logBuf := make([]string, 0)
	defer b.flushLog(&logBuf)

	logBuf = append(logBuf, fmt.Sprintf("Processing plugin %s", plugin.ID))
	numExtensions := len(plugin.CachedExtensions)
	extensionIdx := 0
	for URL, path := range plugin.CachedExtensions {
		extensionIdx = extensionIdx + 1
		logBuf = append(logBuf, fmt.Sprintf("  Installing plugin extension %d/%d", extensionIdx, numExtensions))
		if path != "" {
			logBuf = append(logBuf, "    Plugin already downloaded")
			continue
		}
		logBuf = append(logBuf, fmt.Sprintf("    Downloading plugin from %s", URL))
		logBuf = b.flushLog(&logBuf)
		archivePath, err := b.downloadArchive(URL, plugin.ID, workDir)
		if err != nil {
			return err
		}
		pluginPath, err := b.injectPlugin(plugin, archivePath)
		if err != nil {
			return err
		}
		plugin.CachedExtensions[URL] = pluginPath
	}
	return nil
}

func (b *Broker) downloadArchive(URL string, pluginID string, workDir string) (string, error) {
	archivePath := b.ioUtils.ResolveDestPathFromURL(URL, workDir)
	archivePath, err := b.ioUtils.Download(URL, archivePath, true)
	if err != nil {
		return "", fmt.Errorf("failed to download plugin from %s: %s", URL, err)
	}
	return archivePath, nil
}

func (b *Broker) injectPlugin(plugin *model.CachedPlugin, archivePath string) (string, error) {
	pluginPath := "/plugins"

	if plugin.IsRemote {
		pluginUniqueName := utils.ConvertIDToUniqueName(plugin.ID)
		pluginPath = filepath.Join(pluginPath, "sidecars", pluginUniqueName)
		err := b.ioUtils.MkDir(pluginPath)
		if err != nil {
			return "", err
		}
	}
	pluginArchiveName := b.generatePluginArchiveName(plugin, archivePath)
	pluginArchivePath := filepath.Join(pluginPath, pluginArchiveName)
	err := b.ioUtils.CopyFile(archivePath, pluginArchivePath)
	if err != nil {
		return "", err
	}

	return pluginArchivePath, nil
}

func (b *Broker) flushLog(bufferRef *[]string) []string {
	buffer := *bufferRef
	b.PrintInfoBuffer(buffer)
	return buffer[:0]
}

func (b *Broker) generatePluginArchiveName(plugin *model.CachedPlugin, archivePath string) string {
	archiveName := filepath.Base(archivePath)
	formattedID := strings.ReplaceAll(plugin.ID, "/", ".")
	return fmt.Sprintf("%s.%s.%s", formattedID, b.rand.String(10), archiveName)
}
