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

package utils

import (
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
)

const ChePluginType = "che plugin"
const EditorPluginType = "che editor"
const TheiaPluginType = "theia plugin"
const VscodePluginType = "vs code extension"

func IsTheiaOrVscodePlugin(meta model.PluginMeta) bool {
	pluginType := strings.ToLower(meta.Type)
	return pluginType == TheiaPluginType || pluginType == VscodePluginType
}
