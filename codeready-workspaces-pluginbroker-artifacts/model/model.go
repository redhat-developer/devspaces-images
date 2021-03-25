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

package model

// RuntimeID is an identifier of running workspace.
// Included to the plugin broker log events.
type RuntimeID struct {
	// Workspace is an identifier of the workspace e.g. "workspace123456".
	Workspace string `json:"workspaceId" yaml:"workspaceId"`

	// Environment is a name of environment e.g. "default".
	Environment string `json:"envName" yaml:"envName"`

	// OwnerId is an identifier of user who is runtime owner.
	OwnerId string `json:"ownerId" yaml:"ownerId"`
}

type PluginMeta struct {
	APIVersion string `json:"apiVersion" yaml:"apiVersion"`

	Spec PluginMetaSpec `json:"spec" yaml:"spec"`

	ID string `json:"id" yaml:"id"`

	Name string `json:"name" yaml:"name"`

	DisplayName string `json:"displayName" yaml:"displayName"`

	Publisher string `json:"publisher" yaml:"publisher"`

	Type string `json:"type" yaml:"type"`

	Description string `json:"description" yaml:"description"`

	Version string `json:"version" yaml:"version"`

	Title string `json:"title" yaml:"title"`

	Icon string `json:"icon" yaml:"icon"`
}

type PluginMetaSpec struct {
	Endpoints      []Endpoint  `json:"endpoints" yaml:"endpoints"`
	Containers     []Container `json:"containers" yaml:"containers"`
	InitContainers []Container `json:"initContainers" yaml:"initContainers"`
	WorkspaceEnv   []EnvVar    `json:"workspaceEnv" yaml:"workspaceEnv"`
	Extensions     []string    `json:"extensions" yaml:"extensions"`
}

type PluginFQN struct {
	Registry  string `json:"registry,omitempty" yaml:"registry,omitempty"`
	ID        string `json:"id" yaml:"id"`
	Reference string `json:"reference" yaml:"reference"`
}

type Endpoint struct {
	Name       string            `json:"name" yaml:"name"`
	Public     bool              `json:"public" yaml:"public"`
	TargetPort int               `json:"targetPort" yaml:"targetPort"`
	Attributes map[string]string `json:"attributes" yaml:"attributes"`
}

type EnvVar struct {
	Name  string `json:"name" yaml:"name"`
	Value string `json:"value" yaml:"value"`
}

type Command struct {
	Name       string   `json:"name" yaml:"name"`
	WorkingDir string   `json:"workingDir" yaml:"workingDir"`
	Command    []string `json:"command" yaml:"command"`
}

type Volume struct {
	MountPath string `json:"mountPath" yaml:"mountPath"`
	Name      string `json:"name" yaml:"name"`
	Ephemeral bool   `json:"ephemeral" yaml:"ephemeral"`
}

type ExposedPort struct {
	ExposedPort int `json:"exposedPort" yaml:"exposedPort"`
}

type ExecAction struct {
	Command []string `json:"command" yaml:"command"`
}

type Handler struct {
	Exec *ExecAction `json:"exec,omitempty" yaml:"exec,omitempty"`
}

type Lifecycle struct {
	PostStart *Handler `json:"postStart,omitempty" yaml:"postStart,omitempty"`
	PreStop   *Handler `json:"preStop,omitempty" yaml:"preStop,omitempty"`
}

type Container struct {
	Name          string        `json:"name,omitempty" yaml:"name,omitempty"`
	Image         string        `json:"image,omitempty" yaml:"image,omitempty"`
	Env           []EnvVar      `json:"env" yaml:"env"`
	Commands      []Command     `json:"commands" yaml:"commands"`
	Volumes       []Volume      `json:"volumes" yaml:"volumes"`
	Ports         []ExposedPort `json:"ports" yaml:"ports"`
	CPULimit      string        `json:"cpuLimit,omitempty" yaml:"cpuLimit,omitempty"`
	CPURequest    string        `json:"cpuRequest,omitempty" yaml:"cpuRequest,omitempty"`
	MemoryLimit   string        `json:"memoryLimit,omitempty" yaml:"memoryLimit,omitempty"`
	MemoryRequest string        `json:"memoryRequest,omitempty" yaml:"memoryRequest,omitempty"`
	MountSources  bool          `json:"mountSources" yaml:"mountSources"`
	Command       []string      `json:"command" yaml:"command"`
	Args          []string      `json:"args" yaml:"args"`
	Lifecycle     *Lifecycle    `json:"lifecycle,omitempty" yaml:"lifecycle,omitempty"`
}

type ChePlugin struct {
	ID             string      `json:"id" yaml:"id"`
	Version        string      `json:"version" yaml:"version"`
	Name           string      `json:"name" yaml:"name"`
	Publisher      string      `json:"publisher" yaml:"publisher"`
	Endpoints      []Endpoint  `json:"endpoints" yaml:"endpoints"`
	Containers     []Container `json:"containers" yaml:"containers"`
	InitContainers []Container `json:"initContainers" yaml:"initContainers"`
	WorkspaceEnv   []EnvVar    `json:"workspaceEnv" yaml:"workspaceEnv"`
	Type           string      `json:"type" yaml:"type"`
}

// CachedPlugin represents an "installed" plugin on the filesystem.
// Contains a plugin ID and the extensions it has stored in /plugins
// CachedExtensions is a map of extension URL -> filesystem path, where
// the filesystem path may be an empty string if the extension has not yet
// been downloaded.
type CachedPlugin struct {
	ID               string            `json:"pluginId" yaml:"pluginId"`
	IsRemote         bool              `json:"isRemote" yaml:"isRemote"`
	CachedExtensions map[string]string `json:"cachedExtensions" yaml:"cachedExtensions"`
}

// InstalledPluginJSON represents the JSON object to be stored when tracking
// plugins installed in the current workspace, consisting of a list of cached
// plugins and a version number to track compatibility.
type InstalledPluginJSON struct {
	Version string         `json:"version" yaml:"version"`
	Plugins []CachedPlugin `json:"plugins" yaml:"plugins"`
}
