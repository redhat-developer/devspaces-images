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
	"fmt"
	"regexp"
	"strings"
	"testing"

	"github.com/eclipse/che-plugin-broker/model"
	utilMock "github.com/eclipse/che-plugin-broker/utils/mocks"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

const (
	defaultRegistry = "test-registry.io"
)

func TestGetPluginMetasGetsAllPluginMetas(t *testing.T) {
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("reg1", "id1", ""),
		generatePluginFQN("reg2", "id2", ""),
		generatePluginFQN("reg3", "id3", ""),
	}

	plugin1, plugin1Raw := generatePluginMeta(t, "pub1/name1/ver1")
	plugin2, plugin2Raw := generatePluginMeta(t, "pub2/name2/ver2")
	plugin3, plugin3Raw := generatePluginMeta(t, "pub3/name3/ver3")
	want := []model.PluginMeta{plugin1, plugin2, plugin3}

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "reg1/plugins/id1/meta.yaml").Return(plugin1Raw, nil)
	ioUtil.On("Fetch", "reg2/plugins/id2/meta.yaml").Return(plugin2Raw, nil)
	ioUtil.On("Fetch", "reg3/plugins/id3/meta.yaml").Return(plugin3Raw, nil)

	got, err := GetPluginMetas(pluginFQNs, "", ioUtil)

	ioUtil.AssertExpectations(t)
	assert.Nil(t, err)
	assert.ElementsMatch(t, want, got)
}

func TestGetPluginMetasStopsOnError(t *testing.T) {
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("reg1", "id1", ""),
		generatePluginFQN("reg2", "id2", ""),
	}

	_, plugin1Raw := generatePluginMeta(t, "pub1/name1/ver1")

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "reg1/plugins/id1/meta.yaml").Return(plugin1Raw, nil)
	ioUtil.On("Fetch", "reg2/plugins/id2/meta.yaml").Return(nil, fmt.Errorf("Test error"))

	_, err := GetPluginMetas(pluginFQNs, "", ioUtil)

	ioUtil.AssertExpectations(t)
	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("failed to fetch plugin meta.yaml from URL"), err)
}

func TestGetPluginMetasReportsErrorWhenHttpError(t *testing.T) {
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("reg1", "id1", ""),
		generatePluginFQN("reg2", "id2", ""),
	}

	_, plugin1Raw := generatePluginMeta(t, "pub1/name1/ver1")

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "reg1/plugins/id1/meta.yaml").Return(plugin1Raw, nil)
	ioUtil.On("Fetch", "reg2/plugins/id2/meta.yaml").Return(nil, &HTTPError{Body: "failed"})

	_, err := GetPluginMetas(pluginFQNs, "", ioUtil)

	ioUtil.AssertExpectations(t)
	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("failed to fetch plugin meta.yaml from URL .* Response body:"), err)
}

func TestGetPluginMetasReportsErrorWhenFailsToUnmarshal(t *testing.T) {
	pluginFQNs := []model.PluginFQN{
		generatePluginFQN("reg1", "id1", ""),
	}

	badYaml := []byte("test: test: test: ]")

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "reg1/plugins/id1/meta.yaml").Return(badYaml, nil)

	_, err := GetPluginMetas(pluginFQNs, "", ioUtil)

	ioUtil.AssertExpectations(t)
	assert.NotNil(t, err)
	assert.Regexp(t, regexp.MustCompile("failed to unmarshal downloaded meta.yaml for plugin"), err)
}

func TestGetPluginMeta(t *testing.T) {
	type args struct {
		plugin          model.PluginFQN
		defaultRegistry string
	}
	tests := []struct {
		name          string
		args          args
		fetchURL      string
		fetchErr      error
		wantPluginID  string
		wantErrRegexp *regexp.Regexp
	}{
		{
			name: "Get plugin meta uses reference when available",
			args: args{
				plugin:          generatePluginFQN("registry", "id", "https://reference.io"),
				defaultRegistry: defaultRegistry,
			},
			fetchURL:      "https://reference.io",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: nil,
		},
		{
			name: "Get plugin meta uses defined registry",
			args: args{
				plugin:          generatePluginFQN("myregistry.io", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry,
			},
			fetchURL:      "myregistry.io/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: nil,
		},
		{
			name: "Get plugin meta uses default registry when no registry defined",
			args: args{
				plugin:          generatePluginFQN("", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry,
			},
			fetchURL:      defaultRegistry + "/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: nil,
		},
		{
			name: "Get plugin meta uses defined registry with trailing slash",
			args: args{
				plugin:          generatePluginFQN("myregistry.io", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry + "/",
			},
			fetchURL:      "myregistry.io/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: nil,
		},
		{
			name: "Get plugin meta uses default registry when no registry defined with trailing slash",
			args: args{
				plugin:          generatePluginFQN("", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry + "/",
			},
			fetchURL:      defaultRegistry + "/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: nil,
		},
		{
			name: "Returns error when registry cannot be determined",
			args: args{
				plugin:          generatePluginFQN("", "mypub/myname/myver", ""),
				defaultRegistry: "",
			},
			fetchURL:      "",
			fetchErr:      nil,
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: regexp.MustCompile("plugin '.*' does not specify registry and no default is provided"),
		},
		{
			name: "Returns specific error when fetch fails with HTTP error",
			args: args{
				plugin:          generatePluginFQN("", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry,
			},
			fetchURL:      defaultRegistry + "/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      &HTTPError{Body: "Test error"},
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: regexp.MustCompile("failed to fetch plugin meta.yaml from URL .* Response body:"),
		},
		{
			name: "Returns generic error when fetch fails for unclear reason",
			args: args{
				plugin:          generatePluginFQN("", "mypub/myname/myver", ""),
				defaultRegistry: defaultRegistry,
			},
			fetchURL:      defaultRegistry + "/plugins/mypub/myname/myver/meta.yaml",
			fetchErr:      fmt.Errorf("Test error"),
			wantPluginID:  "mypub/myname/myver",
			wantErrRegexp: regexp.MustCompile("failed to fetch plugin meta.yaml from URL .*"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			meta, metaRaw := generatePluginMeta(t, tt.wantPluginID)

			ioUtil := &utilMock.IoUtil{}
			ioUtil.On("Fetch", tt.fetchURL).Return(metaRaw, tt.fetchErr)
			got, err := GetPluginMeta(tt.args.plugin, tt.args.defaultRegistry, ioUtil)
			if tt.wantErrRegexp != nil {
				assert.NotNil(t, err)
				assert.Regexp(t, tt.wantErrRegexp, err)
			} else {
				assert.Equal(t, meta, *got)
			}
		})
	}
}

func TestGetPluginMetaSetsPluginIdFromPluginFQNWhenAvailable(t *testing.T) {
	meta := model.PluginMeta{
		APIVersion: "apiversion",
		ID:         "",
		Publisher:  "publisher",
		Name:       "name",
		Version:    "version",
		Spec: model.PluginMetaSpec{
			Endpoints:      []model.Endpoint{},
			Containers:     []model.Container{},
			InitContainers: []model.Container{},
			WorkspaceEnv:   []model.EnvVar{},
			Extensions:     []string{},
		},
	}
	metaRaw, err := yaml.Marshal(meta)
	if err != nil {
		t.Error("Failed to marhsal plugin meta yaml")
	}

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "registry.io").Return(metaRaw, nil)

	got, err := GetPluginMeta(generatePluginFQN("", "pluginId", "registry.io"), "", ioUtil)

	assert.Nil(t, err)
	assert.Equal(t, "pluginId", got.ID)
}

func TestGetPluginMetaSetsPluginIdFromPluginMetaWhenFQNEmpty(t *testing.T) {
	meta := model.PluginMeta{
		APIVersion: "apiversion",
		ID:         "",
		Publisher:  "publisher",
		Name:       "name",
		Version:    "version",
		Spec: model.PluginMetaSpec{
			Endpoints:      []model.Endpoint{},
			Containers:     []model.Container{},
			InitContainers: []model.Container{},
			WorkspaceEnv:   []model.EnvVar{},
			Extensions:     []string{},
		},
	}
	metaRaw, err := yaml.Marshal(meta)
	if err != nil {
		t.Error("Failed to marhsal plugin meta yaml")
	}

	ioUtil := &utilMock.IoUtil{}
	ioUtil.On("Fetch", "registry.io").Return(metaRaw, nil)

	got, err := GetPluginMeta(generatePluginFQN("", "", "registry.io"), "", ioUtil)

	assert.Nil(t, err)
	assert.Equal(t, "publisher/name/version", got.ID)
}

func TestResolveRelativeExtensionPaths(t *testing.T) {
	type args struct {
		metas           []model.PluginMeta
		defaultRegistry string
	}
	tests := []struct {
		name      string
		args      args
		want      []model.PluginMeta
		errRegexp *regexp.Regexp
	}{
		{
			name: "Does nothing when no plugins have relative extension",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "github.com/a/b/c"),
				},
				defaultRegistry: "default.io",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "github.com/a/b/c"),
			},
			errRegexp: nil,
		},
		{
			name: "Does nothing when no plugins have relative extension and nil default registry",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "github.com/a/b/c"),
				},
				defaultRegistry: "default.io",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "github.com/a/b/c"),
			},
			errRegexp: nil,
		},
		{
			name: "Correctly resolves relative extension path when default registry is supplied",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c"),
				},
				defaultRegistry: "default.io",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "default.io/a/b/c"),
			},
			errRegexp: nil,
		},
		{
			name: "Resolves registry for multiple extensions",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c", "github.com/x/y/z", "relative:extension/d/e/f"),
				},
				defaultRegistry: "default.io",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "default.io/a/b/c", "github.com/x/y/z", "default.io/d/e/f"),
			},
			errRegexp: nil,
		},
		{
			name: "Resolves registry for multiple plugins",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c"),
					generatePluginMetaWithExtensions(t, "github.com/x/y/z", "relative:extension/d/e/f"),
				},
				defaultRegistry: "default.io",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "default.io/a/b/c"),
				generatePluginMetaWithExtensions(t, "github.com/x/y/z", "default.io/d/e/f"),
			},
			errRegexp: nil,
		},
		{
			name: "Returns error when default registry not specified",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c"),
				},
				defaultRegistry: "",
			},
			want:      []model.PluginMeta{},
			errRegexp: regexp.MustCompile("cannot resolve relative extension path without default registry"),
		},
		{
			name: "Returns error when default registry cannot be parsed",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c"),
				},
				defaultRegistry: ":/default.io",
			},
			want:      []model.PluginMeta{},
			errRegexp: regexp.MustCompile("failed to parse default registry URL"),
		},
		{
			name: "Returns error when relative extension path not subpath",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/../c"),
				},
				defaultRegistry: "default.io",
			},
			want:      []model.PluginMeta{},
			errRegexp: regexp.MustCompile("plugin reference path .* cannot refer to parent directories"),
		},
		{
			name: "Handles trailing slash in default registry",
			args: args{
				metas: []model.PluginMeta{
					generatePluginMetaWithExtensions(t, "a/b/c", "relative:extension/a/b/c"),
				},
				defaultRegistry: "default.io/",
			},
			want: []model.PluginMeta{
				generatePluginMetaWithExtensions(t, "a/b/c", "default.io/a/b/c"),
			},
			errRegexp: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ResolveRelativeExtensionPaths(tt.args.metas, tt.args.defaultRegistry)
			if tt.errRegexp == nil {
				assert.Nil(t, err)
				assert.Equal(t, len(tt.want), len(tt.args.metas))
				assert.Subset(t, tt.want, tt.args.metas)
			} else {
				assert.NotNil(t, err)
				assert.Regexp(t, tt.errRegexp, err)
			}
		})
	}
}

func generatePluginFQN(registry, id, reference string) model.PluginFQN {
	return model.PluginFQN{
		Registry:  registry,
		ID:        id,
		Reference: reference,
	}
}

func generatePluginMeta(t *testing.T, id string) (model.PluginMeta, []byte) {
	fields := strings.Split(id, "/")

	meta := model.PluginMeta{
		APIVersion: "apiversion",
		ID:         id,
		Publisher:  fields[0],
		Name:       fields[1],
		Version:    fields[2],
		Spec: model.PluginMetaSpec{
			Endpoints:      []model.Endpoint{},
			Containers:     []model.Container{},
			InitContainers: []model.Container{},
			WorkspaceEnv:   []model.EnvVar{},
			Extensions:     []string{},
		},
	}
	metaRaw, err := yaml.Marshal(meta)
	if err != nil {
		t.Error("Failed to marshal yaml")
	}
	return meta, metaRaw
}

func generatePluginMetaWithExtensions(t *testing.T, id string, extensions ...string) model.PluginMeta {
	meta, _ := generatePluginMeta(t, id)
	meta.Spec.Extensions = extensions
	return meta
}
