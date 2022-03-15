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
	"regexp"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/eclipse/che-plugin-broker/model"
)

func TestGetExtensionCollisions(t *testing.T) {
	metas := []model.PluginMeta{
		generateMetaWithExtensions("test/conflict_one", "aaa", "bbb"),
		generateMetaWithExtensions("test/no_conflict", "ddd"),
		generateMetaWithExtensions("test/conflict_two", "ccc", "bbb"),
	}

	output := GetExtensionCollisions(metas)
	assert.NotEmpty(t, output)
	assert.ElementsMatch(t, output["bbb"], []string{"test/conflict_one", "test/conflict_two"})
	assert.NotContains(t, output, "aaa")
	assert.NotContains(t, output, "ccc")
	assert.NotContains(t, output, "ddd")
}

func TestGetExtensionCollisionsMulti(t *testing.T) {
	metas := []model.PluginMeta{
		generateMetaWithExtensions("one", "aaa", "bbb"),
		generateMetaWithExtensions("two", "xxx", "bbb"),
		generateMetaWithExtensions("three", "aaa", "yyy"),
	}

	output := GetExtensionCollisions(metas)
	assert.NotEmpty(t, output)
	assert.ElementsMatch(t, output["aaa"], []string{"one", "three"})
	assert.ElementsMatch(t, output["bbb"], []string{"one", "two"})
	assert.NotContains(t, output, "xxx")
	assert.NotContains(t, output, "yyy")
}

func TestConvertCollisionsToLog(t *testing.T) {
	collisions := map[string][]string{
		"ext1": []string{"plugin_a", "plugin_b"},
		"ext2": []string{"plugin_c", "plugin_d", "plugin_e"},
	}
	output := ConvertCollisionsToLog(collisions)
	for _, test := range []string{
		".*ext1.*", ".*ext2.*", ".*plugin_a.*", ".*plugin_b.*", ".*plugin_c.*", ".*plugin_d.*", ".*plugin_e.*",
	} {
		assertMatchSliceRegexp(t, output, test)
	}
}

func generateMetaWithExtensions(id string, exts ...string) model.PluginMeta {
	return model.PluginMeta{
		ID: id,
		Spec: model.PluginMetaSpec{
			Extensions: exts,
		},
	}
}

func assertMatchSliceRegexp(t *testing.T, slice []string, pattern string) {
	re := regexp.MustCompile(pattern)
	match := false
	for _, str := range slice {
		if re.MatchString(str) {
			match = true
		}
	}
	assert.Truef(t, match, "Expected '%s' to be logged but got:\n%s", pattern, strings.Join(slice, "\n"))
}
