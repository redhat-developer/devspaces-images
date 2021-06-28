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
	"testing"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/stretchr/testify/assert"
)

func TestValidateMetas(t *testing.T) {
	type args struct {
		meta model.PluginMeta
	}
	tests := []struct {
		name       string
		args       args
		wantRegexp *regexp.Regexp
	}{
		{
			name: "Validation error when no apiVersion",
			args: args{
				meta: model.PluginMeta{
					ID: "test",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'apiVersion' must be present"),
		},
		{
			name: "Validation error when no wrong apiVersion",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v1",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'apiVersion' contains invalid version 'v1'"),
		},
		{
			name: "Validation error when Che Plugin has extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Che Plugin",
					Spec: model.PluginMetaSpec{
						Extensions: []string{"bad"},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' is not allowed in plugin of type 'Che Plugin'"),
		},
		{
			name: "Validation error when Che Plugin has no containers",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Che Plugin",
					Spec: model.PluginMetaSpec{
						Containers: []model.Container{},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.containers' must not be empty"),
		},
		{
			name: "Validation error when Che Editor has extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Che Editor",
					Spec: model.PluginMetaSpec{
						Extensions: []string{"bad"},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' is not allowed in plugin of type 'Che Editor'"),
		},
		{
			name: "Validation error when Che Editor has extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Che Editor",
					Spec: model.PluginMetaSpec{
						Containers: []model.Container{},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.containers' must not be empty"),
		},
		{
			name: "Validation error when Theia Plugin has no extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Theia Plugin",
					Spec: model.PluginMetaSpec{
						Extensions: []string{},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' must not be empty"),
		},
		{
			name: "Validation error when Theia Plugin has no extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Theia Plugin",
					Spec: model.PluginMetaSpec{
						Containers: []model.Container{
							model.Container{Name: "one"},
							model.Container{Name: "two"},
						},
						Extensions: []string{"hello"},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Containers list 'spec.containers' must not contain more than 1 container, but '2' found"),
		},
		{
			name: "Validation error when VS Code Plugin has no extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "VS Code Extension",
					Spec: model.PluginMetaSpec{
						Extensions: []string{},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' must not be empty"),
		},
		{
			name: "Validation error when VS Code Plugin has no extensions",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "VS Code Extension",
					Spec: model.PluginMetaSpec{
						Containers: []model.Container{
							model.Container{Name: "one"},
							model.Container{Name: "two"},
						},
						Extensions: []string{"hello"},
					},
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Containers list 'spec.containers' must not contain more than 1 container, but '2' found"),
		},
		{
			name: "Validation error when no Type field",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
				},
			},
			wantRegexp: regexp.MustCompile("Type field is missing in meta information of plugin 'test'"),
		},
		{
			name: "Validation error when no Type field",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "Invalid",
				},
			},
			wantRegexp: regexp.MustCompile("Type 'Invalid' of plugin 'test' is unsupported"),
		},
		{
			name: "Che Plugin type is case insensitive",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "cHE pLUGIN",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.containers' must not be empty"),
		},
		{
			name: "Che Editor type is case insensitive",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "cHE eDITOR",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.containers' must not be empty"),
		},
		{
			name: "Theia Plugin type is case insensitive",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "tHEIA pLUGIN",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' must not be empty"),
		},
		{
			name: "Che Editor type is case insensitive",
			args: args{
				meta: model.PluginMeta{
					ID:         "test",
					APIVersion: "v2",
					Type:       "vs CODE eXTENSION",
				},
			},
			wantRegexp: regexp.MustCompile("Plugin 'test' is invalid. Field 'spec.extensions' must not be empty"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateMetas(tt.args.meta)
			if tt.wantRegexp != nil {
				assert.NotNil(t, err)
				assert.Regexp(t, tt.wantRegexp, err)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}
