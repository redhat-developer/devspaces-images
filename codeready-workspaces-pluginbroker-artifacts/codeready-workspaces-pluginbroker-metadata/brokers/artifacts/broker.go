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
	"github.com/eclipse/che-plugin-broker/cfg"

	jsonrpc "github.com/eclipse/che-go-jsonrpc"
	"github.com/eclipse/che-plugin-broker/common"
	"github.com/eclipse/che-plugin-broker/model"
	"github.com/eclipse/che-plugin-broker/utils"
	"github.com/eclipse/che-plugin-broker/utils/mergeplugins"
)

// Broker is used to process Che plugins
type Broker struct {
	common.Broker
	ioUtils utils.IoUtil
	rand    common.Random
}

// NewBroker creates Che broker instance
func NewBroker(localhostSidecar bool) *Broker {
	return &Broker{
		Broker:  common.NewBroker(),
		ioUtils: utils.New(),
		rand:    common.NewRand(),
	}
}

func (b *Broker) fail(err error) error {
	b.PubFailed(err.Error())
	b.PubLog(err.Error())
	return err
}

// PushEvents sets given tunnel as consumer of broker events.
func (b *Broker) PushEvents(tun *jsonrpc.Tunnel) {
	b.Broker.PushEvents(tun, model.BrokerStatusEventType, model.BrokerResultEventType, model.BrokerLogEventType)
}

// Start downloads metas from plugin registry for specified
// pluginFQNs and then executes plugins metas processing and sending data to Che master
func (b *Broker) Start(pluginFQNs []model.PluginFQN, defaultRegistry string) error {
	defer b.CloseConsumers()
	b.PubStarted()
	b.PrintInfo("Starting plugin artifacts broker")

	pluginMetas, err := utils.GetPluginMetas(pluginFQNs, defaultRegistry, b.ioUtils)
	if err != nil {
		return b.fail(fmt.Errorf("Failed to download plugin meta: %s", err))
	}

	err = utils.ResolveRelativeExtensionPaths(pluginMetas, defaultRegistry)
	if err != nil {
		return b.fail(err)
	}
	metasToProcess := pluginMetas
	if cfg.MergePlugins{
		var logs []string
		metasToProcess, logs = mergeplugins.MergePlugins(pluginMetas)
		b.PrintInfoBuffer(logs)
	}

	requestedPlugins := convertMetasToPlugins(metasToProcess)
	toInstall := b.syncWithPluginsDir(requestedPlugins)

	for _, plugin := range toInstall {
		err = b.ProcessPlugin(&plugin)
		if err != nil {
			return b.fail(err)
		}
	}

	err = b.writeInstalledPlugins(toInstall)
	if err != nil {
		b.PrintInfo("WARN: Failed to log installed plugins: %s", err)
	}

	b.PrintInfo("All plugin artifacts have been successfully downloaded")
	b.PubDone("")
	return nil
}

func convertMetasToPlugins(metas []model.PluginMeta) []model.CachedPlugin {
	plugins := make([]model.CachedPlugin, 0)

	for _, meta := range metas {
		if !utils.IsTheiaOrVscodePlugin(meta) {
			continue
		}
		plugin := model.CachedPlugin{}
		plugin.ID = meta.ID
		if len(meta.Spec.Containers) > 0 {
			plugin.IsRemote = true
		}
		plugin.CachedExtensions = make(map[string]string)
		for _, ext := range meta.Spec.Extensions {
			plugin.CachedExtensions[ext] = ""
		}
		plugins = append(plugins, plugin)
	}

	return plugins
}
