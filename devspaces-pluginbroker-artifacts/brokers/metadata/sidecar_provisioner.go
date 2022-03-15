package metadata

import (
	"strconv"

	"github.com/eclipse/che-plugin-broker/common"
	"github.com/eclipse/che-plugin-broker/model"
	"github.com/eclipse/che-plugin-broker/utils"
)

const (
	sidecarVolumeName       = "plugins"
	sidecarVolumeMountPath  = "/plugins"
	theiaEndpointPortEnvVar = "THEIA_PLUGIN_ENDPOINT_PORT"
	theiaPluginsEnvVar      = "THEIA_PLUGINS"
	pluginsPathBase         = "local-dir:///plugins/sidecars/"
	remoteEndpointBase      = "THEIA_PLUGIN_REMOTE_ENDPOINT_"
)

// AddPluginRunnerRequirements adds to ChePlugin configuration needed to run remote Theia plugins in the provided ChePlugin.
// Method adds needed ports, endpoints, volumes, environment variables.
// ChePlugin with one container is supported only.
func AddPluginRunnerRequirements(meta model.PluginMeta, rand common.Random, useLocalhost bool) model.PluginMeta {
	// TODO limitation is one and only sidecar
	container := &meta.Spec.Containers[0]
	container.Volumes = append(container.Volumes, model.Volume{
		Name:      sidecarVolumeName,
		MountPath: sidecarVolumeMountPath,
	})
	container.MountSources = true
	if !useLocalhost {
		meta = provisionNonLocalHost(meta, rand)
	}
	container.Env = append(container.Env, model.EnvVar{
		Name:  theiaPluginsEnvVar,
		Value: pluginsPathBase + utils.GetPluginUniqueName(meta),
	})

	return meta
}

func provisionNonLocalHost(meta model.PluginMeta, rand common.Random) model.PluginMeta {
	container := &meta.Spec.Containers[0]
	endpoint := generateTheiaSidecarEndpoint(rand)
	port := endpoint.TargetPort
	container.Ports = append(container.Ports, model.ExposedPort{ExposedPort: port})
	meta.Spec.Endpoints = append(meta.Spec.Endpoints, endpoint)
	container.Env = append(container.Env, model.EnvVar{
		Name:  theiaEndpointPortEnvVar,
		Value: strconv.Itoa(port),
	})
	meta.Spec.WorkspaceEnv = append(meta.Spec.WorkspaceEnv, model.EnvVar{
		Name:  remoteEndpointBase + utils.GetPluginUniqueName(meta),
		Value: "ws://" + endpoint.Name + ":" + strconv.Itoa(endpoint.TargetPort),
	})
	return meta
}

// Generates random non-publicly exposed endpoint for sidecar to allow Theia connecting to it
func generateTheiaSidecarEndpoint(rand common.Random) model.Endpoint {
	endpointName := rand.String(10)
	port := rand.IntFromRange(4000, 10000)
	return model.Endpoint{
		Name:       endpointName,
		Public:     false,
		TargetPort: port,
	}
}
