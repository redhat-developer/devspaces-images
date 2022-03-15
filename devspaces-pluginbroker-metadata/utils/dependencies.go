//
// Copyright (c) 2020 Red Hat, Inc.
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
	"fmt"

	"github.com/eclipse/che-plugin-broker/model"
)

// GetExtensionCollisions checks a list of plugin metas for extensions shared by
// more than one plugin. Return value is a list of
func GetExtensionCollisions(metas []model.PluginMeta) map[string][]string {
	extensions := map[string][]string{}
	for _, meta := range metas {
		for _, ext := range meta.Spec.Extensions {
			extensions[ext] = append(extensions[ext], meta.ID)
		}
	}
	collisions := make(map[string][]string)
	for ext, ids := range extensions {
		if len(ids) > 1 {
			collisions[ext] = ids
		}
	}
	return collisions
}

// ConvertCollisionsToLog converts the output of GetExtensionCollisions to a human-readable
// string. Output is a slice of strings, to be joined by newlines
func ConvertCollisionsToLog(collisions map[string][]string) []string {
	var output []string
	for ext, plugins := range collisions {
		output = append(output, "  Plugins")
		for _, plugin := range plugins {
			output = append(output, fmt.Sprintf("    - %s", plugin))
		}
		if len(plugins) > 2 {
			output = append(output, "  all depend on and embed extension")
		} else {
			output = append(output, "  both depend on and embed extension")
		}
		output = append(output, fmt.Sprintf("    %s", ext))
	}
	return output
}
