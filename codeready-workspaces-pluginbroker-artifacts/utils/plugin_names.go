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
	"regexp"

	"github.com/eclipse/che-plugin-broker/model"
)

var re = regexp.MustCompile(`[^a-zA-Z_0-9]+`)

// GetPluginUniqueName generates a unique plugin name from plugin publisher,
// version, and name
func GetPluginUniqueName(meta model.PluginMeta) string {
	return re.ReplaceAllString(meta.Publisher+"_"+meta.Name+"_"+meta.Version, `_`)
}

// ConvertIDToUniqueName converts a plugin ID to a unique plugin name
func ConvertIDToUniqueName(id string) string {
	return re.ReplaceAllString(id, "_")
}

func SanitizeImage(image string) string {
	return re.ReplaceAllString(image, "-")
}
