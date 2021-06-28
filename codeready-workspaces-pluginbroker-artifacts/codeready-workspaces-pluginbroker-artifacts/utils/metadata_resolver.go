package utils

import (
	"fmt"
	"log"
	"net/url"
	"path"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
	"gopkg.in/yaml.v2"
)

// RegistryURLFormat specifies the format string for registry urls
// when downloading metas
const RegistryURLFormat = "%s/%s/meta.yaml"

// GetPluginMetas retrieves plugin metas for a list of plugin FQNs. This method is
// a thin wrapper over GetPluginMeta.
func GetPluginMetas(plugins []model.PluginFQN, defaultRegistry string, ioUtil IoUtil) ([]model.PluginMeta, error) {
	metas := make([]model.PluginMeta, 0, len(plugins))
	for _, plugin := range plugins {
		pluginMeta, err := GetPluginMeta(plugin, defaultRegistry, ioUtil)
		if err != nil {
			return nil, err
		}
		metas = append(metas, *pluginMeta)
	}
	return metas, nil
}

// GetPluginMeta downloads the metadata for a plugin. If specified,
// defaultRegistry is used as the registry when plugin does not specify its registry.
// If defaultRegistry is empty, and plugin does not specify a registry, an error is returned.
func GetPluginMeta(plugin model.PluginFQN, defaultRegistry string, ioUtil IoUtil) (*model.PluginMeta, error) {
	var pluginURL string
	if plugin.Reference != "" {
		pluginURL = plugin.Reference
	} else {
		registry, err := getRegistryURL(plugin, defaultRegistry)
		if err != nil {
			return nil, err
		}
		pluginURL = fmt.Sprintf(RegistryURLFormat, registry, plugin.ID)
		log.Printf("Fetching plugin meta.yaml from %s", pluginURL)
	}
	pluginRaw, err := ioUtil.Fetch(pluginURL)
	if err != nil {
		if httpErr, ok := err.(*HTTPError); ok {
			return nil, fmt.Errorf(
				"failed to fetch plugin meta.yaml from URL '%s': %s. Response body: %s",
				pluginURL, httpErr, httpErr.Body)
		} else {
			return nil, fmt.Errorf(
				"failed to fetch plugin meta.yaml from URL '%s': %s",
				pluginURL, err)
		}
	}

	var pluginMeta model.PluginMeta
	if err := yaml.Unmarshal(pluginRaw, &pluginMeta); err != nil {
		return nil, fmt.Errorf(
			"failed to unmarshal downloaded meta.yaml for plugin '%s': %s", plugin.ID, err)
	}
	// Ensure ID field is set since it is used all over the place in broker
	// This could be unset if e.g. a meta.yaml is passed via a reference and does not have ID set.
	if pluginMeta.ID == "" {
		if plugin.ID != "" {
			pluginMeta.ID = plugin.ID
		} else {
			pluginMeta.ID = fmt.Sprintf("%s/%s/%s", pluginMeta.Publisher, pluginMeta.Name, pluginMeta.Version)
		}
	}
	return &pluginMeta, nil
}

func getRegistryURL(plugin model.PluginFQN, defaultRegistry string) (string, error) {
	var registry string
	if plugin.Registry != "" {
		registry = strings.TrimSuffix(plugin.Registry, "/") + "/plugins"
	} else {
		if defaultRegistry == "" {
			return "", fmt.Errorf("plugin '%s' does not specify registry and no default is provided", plugin.ID)
		}
		registry = strings.TrimSuffix(defaultRegistry, "/") + "/plugins"
	}
	return registry, nil
}

// ResolveRelativeExtensionPaths takes a slice of plugin metas and updates relative extension
// references (e.g. relative:extension/[...]) to point to relative paths in the default registry.
func ResolveRelativeExtensionPaths(metas []model.PluginMeta, defaultRegistry string) error {
	for i, meta := range metas {
		for j, extension := range meta.Spec.Extensions {
			if strings.HasPrefix(extension, "relative:extension/") {
				if defaultRegistry == "" {
					return fmt.Errorf("cannot resolve relative extension path without default registry")
				}
				pluginURL, err := url.Parse(defaultRegistry)
				if err != nil {
					return fmt.Errorf("failed to parse default registry URL: %s", err)
				}
				relativePath := strings.TrimPrefix(extension, "relative:extension/")
				if strings.Contains(relativePath, "..") {
					return fmt.Errorf("plugin reference path '%s' cannot refer to parent directories", relativePath)
				}
				pluginURL.Path = path.Join(pluginURL.Path, strings.TrimPrefix(extension, "relative:extension/"))
				metas[i].Spec.Extensions[j] = pluginURL.String()
			}
		}
	}
	return nil
}
