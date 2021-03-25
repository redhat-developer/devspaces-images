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
package mergeplugins

import (
	"io/ioutil"
	"path/filepath"
	"regexp"
	"testing"

	"k8s.io/apimachinery/pkg/api/resource"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

type testdata struct {
	// Metas input metas to be merged
	Metas []model.PluginMeta
	// Expected the expected merged meta
	Expected []model.PluginMeta
}

func TestMergePluginsIgnoresInvalidPlugins(t *testing.T) {
	data := loadPluginMetasFromFile(t, "success/ignore_unmergeable_plugins.yaml")
	inputPlugins := data.Metas
	expectedPlugins := data.Expected
	actualPlugins, _ := MergePlugins(inputPlugins)
	assert.Equal(t, expectedPlugins, actualPlugins)
}

func TestMergePluginsDoesNothingWhenMergeFails(t *testing.T) {
	data := loadPluginMetasFromFile(t, "success/does_not_modify_unmergeable_plugins.yaml")
	inputPlugins := data.Metas
	expectedPlugins := data.Expected
	actualPlugins, _ := MergePlugins(inputPlugins)
	assert.Equal(t, expectedPlugins, actualPlugins)
}

func TestMergePluginsForImageFailureModes(t *testing.T) {
	tests := []struct {
		name              string
		args              []model.PluginMeta
		expectedErrRegexp *regexp.Regexp
	}{
		{
			name:              "Env cannot be merged",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_env_var.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`different values for container environment variable TEST_ENV`),
		},
		{
			name:              "WorkspaceEnv cannot be merged",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_workspace_env.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`different values for workspace environment variable TEST_ENV`),
		},
		{
			name:              "Failure to parse resources",
			args:              loadPluginMetasFromFile(t, "failure/malformed_resources.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`failed to parse`),
		},
		{
			name:              "Same command with different workingDirs",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_command_working_dir.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`command .* collides with another command`),
		},
		{
			name:              "Same command with different commandline length",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_command_commandline.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`command .* collides with another command`),
		},
		{
			name:              "Same command with different commandline",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_command_commandline_length.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`command .* collides with another command`),
		},
		{
			name:              "Same volume MountPath but conflicting ephemeral",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_volumes.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`some volumes mounted to /testpath are ephemeral while others are not`),
		},
		{
			name:              "Same volume name but conflicting mountPath",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_volumes_mountPath.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`volumes share name 'samename' but have different mountPath`),
		},
		{
			name:              "Conflicting endpoints",
			args:              loadPluginMetasFromFile(t, "failure/conflicting_endpoints.yaml").Metas,
			expectedErrRegexp: regexp.MustCompile(`conflicting endpoints`),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := mergePluginsForImage("testimg", tt.args)
			if assert.Error(t, err) {
				assert.Regexp(t, tt.expectedErrRegexp, err.Error(), "Error message should match regex")
			}
		})
	}
}

func TestMergePluginsForImageSuccessfully(t *testing.T) {
	tests := []struct {
		name     string
		testdata testdata
	}{
		{
			name:     "Merging duplicated elements",
			testdata: loadPluginMetasFromFile(t, "success/duplicate_elements.yaml"),
		},
		{
			name:     "Correctly adds resources",
			testdata: loadPluginMetasFromFile(t, "success/merging_resources.yaml"),
		},
		{
			name:     "Combines volumes with different names if mountpath is same",
			testdata: loadPluginMetasFromFile(t, "success/combine_volumes_on_mountpath.yaml"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			plugImage := tt.testdata.Metas[0].Spec.Containers[0].Image
			actual, err := mergePluginsForImage(plugImage, tt.testdata.Metas)
			assert.NoError(t, err)
			assert.Equal(t, tt.testdata.Expected[0], *actual)
		})
	}
}

func TestAddResources(t *testing.T) {
	type containerResourcesString struct {
		memLimit   string
		memRequest string
		cpuLimit   string
		cpuRequest string
	}
	newContainerResources := func(memLimit, memRequest, cpuLimit, cpuRequest string) *containerResourcesString {
		return &containerResourcesString{
			memLimit:   memLimit,
			memRequest: memRequest,
			cpuLimit:   cpuLimit,
			cpuRequest: cpuRequest,
		}
	}
	newContainer := func(memLimit, memRequest, cpuLimit, cpuRequest string) model.Container {
		return model.Container{
			MemoryLimit:   memLimit,
			MemoryRequest: memRequest,
			CPULimit:      cpuLimit,
			CPURequest:    cpuRequest,
		}
	}
	tests := []struct {
		name              string
		inResources       *containerResourcesString
		inContainer       model.Container
		outResources      *containerResourcesString
		expectedErrRegexp *regexp.Regexp
	}{
		{
			name:         "Parses and adds resources to newly initialized struct",
			inResources:  newContainerResources("", "", "", ""),
			inContainer:  newContainer("200Mi", "100Mi", "200m", "100m"),
			outResources: newContainerResources("200Mi", "100Mi", "200m", "100m"),
		},
		{
			name:         "Parses and adds resources",
			inResources:  newContainerResources("200Mi", "100Mi", "200m", "100m"),
			inContainer:  newContainer("200Mi", "100Mi", "200m", "100m"),
			outResources: newContainerResources("400Mi", "200Mi", "400m", "200m"),
		},
		{
			name:         "Resources are formatted according to k8s rules",
			inResources:  newContainerResources("200Mi", "100Mi", "200m", "100m"),
			inContainer:  newContainer("800Mi", "924Mi", "800m", "1"),
			outResources: newContainerResources("1000Mi", "1Gi", "1", "1100m"),
		},
		{
			name:         "Handles empty values in container",
			inResources:  newContainerResources("200Mi", "100Mi", "200m", "100m"),
			inContainer:  newContainer("800Mi", "", "", ""),
			outResources: newContainerResources("1000Mi", "100Mi", "200m", "100m"),
		},
		{
			name:              "Parsing error on memory limit",
			inResources:       newContainerResources("", "", "", ""),
			inContainer:       newContainer("800i", "", "", ""),
			expectedErrRegexp: regexp.MustCompile("failed to parse memory limit"),
		},
		{
			name:              "Parsing error on memory request",
			inResources:       newContainerResources("", "", "", ""),
			inContainer:       newContainer("", "1i", "", ""),
			expectedErrRegexp: regexp.MustCompile("failed to parse memory request"),
		},
		{
			name:              "Parsing error on cpu limit",
			inResources:       newContainerResources("", "", "", ""),
			inContainer:       newContainer("", "", "2H", ""),
			expectedErrRegexp: regexp.MustCompile("failed to parse cpu limit"),
		},
		{
			name:              "Parsing error on cpu request",
			inResources:       newContainerResources("", "", "", ""),
			inContainer:       newContainer("", "", "", "1,00Gi"),
			expectedErrRegexp: regexp.MustCompile("failed to parse cpu request"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := newResources()
			if tt.inResources.memLimit != "" {
				memLimit := resource.MustParse(tt.inResources.memLimit)
				input.memLimit = &memLimit
			}
			if tt.inResources.memRequest != "" {
				memRequest := resource.MustParse(tt.inResources.memRequest)
				input.memRequest = &memRequest
			}
			if tt.inResources.cpuLimit != "" {
				cpuLimit := resource.MustParse(tt.inResources.cpuLimit)
				input.cpuLimit = &cpuLimit
			}
			if tt.inResources.cpuRequest != "" {
				cpuRequest := resource.MustParse(tt.inResources.cpuRequest)
				input.cpuRequest = &cpuRequest
			}
			err := addResources(&input, tt.inContainer)
			if tt.expectedErrRegexp != nil {
				if assert.Error(t, err) {
					assert.Regexp(t, tt.expectedErrRegexp, err)
				}
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.outResources.memLimit, input.memLimit.String())
				assert.Equal(t, tt.outResources.memRequest, input.memRequest.String())
				assert.Equal(t, tt.outResources.cpuLimit, input.cpuLimit.String())
				assert.Equal(t, tt.outResources.cpuRequest, input.cpuRequest.String())
			}
		})
	}
}

func TestCanBeMerged(t *testing.T) {
	tests := []struct {
		name     string
		args     model.PluginMeta
		expected bool
	}{
		{
			name: "Can't be merged if not Theia Plugin",
			args: model.PluginMeta{
				Type: model.ChePluginType,
			},
			expected: false,
		},
		{
			name: "Can't be merged if multiple containers",
			args: model.PluginMeta{
				Type: model.TheiaPluginType,
				Spec: model.PluginMetaSpec{
					Containers: []model.Container{
						{Name: "container1"},
						{Name: "container2"},
					},
				},
			},
			expected: false,
		},
		{
			name: "Can't be merged if container has command",
			args: model.PluginMeta{
				Type: model.TheiaPluginType,
				Spec: model.PluginMetaSpec{
					Containers: []model.Container{
						{
							Name:    "container1",
							Command: []string{"ls"},
						},
					},
				},
			},
			expected: false,
		},
		{
			name: "Can't be merged if container has args",
			args: model.PluginMeta{
				Type: model.TheiaPluginType,
				Spec: model.PluginMetaSpec{
					Containers: []model.Container{
						{
							Name: "container1",
							Args: []string{"ls"},
						},
					},
				},
			},
			expected: false,
		},
		{
			name: "Can't be merged if container has lifecycle",
			args: model.PluginMeta{
				Type: model.TheiaPluginType,
				Spec: model.PluginMetaSpec{
					Containers: []model.Container{
						{
							Name: "container1",
							Lifecycle: &model.Lifecycle{
								PostStart: &model.Handler{
									Exec: &model.ExecAction{
										Command: []string{"ls"},
									},
								},
							},
						},
					},
				},
			},
			expected: false,
		},
		{
			name: "Can't be merged if plugin has initContainer",
			args: model.PluginMeta{
				Type: model.TheiaPluginType,
				Spec: model.PluginMetaSpec{
					Containers: []model.Container{
						{Name: "container1"},
					},
					InitContainers: []model.Container{
						{Name: "initContainer1"},
					},
				},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := pluginMergable(tt.args)
			assert.Equal(t, tt.expected, actual,
				"Expected plugin mergeability to be '%t' but was '%t'", tt.expected, actual)
		})
	}
}

func loadPluginMetasFromFile(t *testing.T, metaFile string) testdata {
	metaPath := filepath.Join("./testdata", metaFile)
	bytes, err := ioutil.ReadFile(metaPath)
	if err != nil {
		t.Fatal(err)
	}
	var input testdata
	if err := yaml.Unmarshal(bytes, &input); err != nil {
		t.Fatal(err)
	}
	return input
}
