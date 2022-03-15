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

package cfg

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/eclipse/che-plugin-broker/model"
)

var (
	// FilePath path to config file.
	FilePath string

	// PushStatusesEndpoint where to push statuses.
	PushStatusesEndpoint string

	// AuthEnabled whether authentication is needed
	AuthEnabled bool

	// Token to access wsmaster API
	Token string

	// RuntimeID the id of workspace runtime this machine belongs to.
	RuntimeID    model.RuntimeID
	runtimeIDRaw string

	// DisablePushingToEndpoint disables pushing anything to the endpoint
	DisablePushingToEndpoint bool

	// PrintEventsOnly disable output of broker logs and instead prints events that are supposed
	// to be sent to endpoint. This helps imitate what info about plugin brokering
	// a user would see
	PrintEventsOnly bool

	// UseLocalhostInPluginUrls configures the broker to use the `localhost` name
	// instead of the Kubernetes service name to build Theia or VSCode plugin
	// endpoint URL
	// True by default since until now all remote VS Code or Theia plugin containers
	// are started on the same POD as the Theia IDE container
	UseLocalhostInPluginUrls = true

	// OnlyApplyMetadataActions configures the broker to only apply metadata-related
	// steps, without copying any file into the `plugins` directory
	OnlyApplyMetadataActions bool

	// RegistryAddress address of the plugin registry, if plugin IDs are specified in config instead of metas.
	// Used as a default registry if a plugin fully-qualified name does not specify a registry.
	RegistryAddress string

	// SelfSignedCertificateFilePath path to certificate file that should be used while connection establishing to Che server.
	// Usually it contains Che server self-signed certificate.
	SelfSignedCertificateFilePath string

	// CABundleDirPath Path to directory with trusted CA certificates.
	// Usually they contain all the trusted CA in the cluster.
	CABundleDirPath string

	// MergePlugins determines whether the brokers should attempt to merge plugins
	// when they run in the same sidecar image
	MergePlugins bool
)

func init() {
	curDir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	flag.StringVar(
		&FilePath,
		"metas",
		curDir+string(os.PathSeparator)+"config.json",
		"Path to configuration file on filesystem",
	)
	flag.StringVar(
		&PushStatusesEndpoint,
		"push-endpoint",
		"",
		"WebSocket endpoint where to push statuses",
	)
	// auth configuration
	defaultAuthEnabled := false
	authEnabledEnv := os.Getenv("CHE_AUTH_ENABLED")
	b, e := strconv.ParseBool(authEnabledEnv)
	if e == nil {
		defaultAuthEnabled = b
	}
	flag.BoolVar(
		&AuthEnabled,
		"enable-auth",
		defaultAuthEnabled,
		"Whether authenticate requests on workspace master before allowing them to proceed."+
			"By default the value from 'CHE_AUTH_ENABLED' environment variable is used or `false` if it is missing",
	)
	flag.StringVar(
		&runtimeIDRaw,
		"runtime-id",
		"",
		"The identifier of the runtime in format 'workspace:environment:ownerId'",
	)
	flag.BoolVar(
		&DisablePushingToEndpoint,
		"disable-push",
		false,
		"Whether pushing of data and logs to endpoint should be disabled. "+
			"`false` by default. Needed for testing and debugging purposes",
	)
	flag.BoolVar(
		&PrintEventsOnly,
		"print-events-only",
		false,
		"Output events that are usually sent Che master instead of regular logs to imitate what a user can see."+
			"`false` by default. Needed for testing and debugging purposes",
	)
	flag.BoolVar(
		&UseLocalhostInPluginUrls,
		"use-localhost-in-plugin-urls",
		true,
		"This configures the broker to use the `localhost` name instead of the Kubernetes service name to build Theia or VSCode plugin endpoint URL."+
			"`true` by default since until now all remote VS Code or Theia plugin containers are started on the same POD as the Theia IDE container",
	)
	flag.StringVar(
		&RegistryAddress,
		"registry-address",
		"",
		"Default address of registry from which to retrieve meta.yaml's when plugin FQNs do not specify a registry",
	)
	flag.StringVar(
		&SelfSignedCertificateFilePath,
		"cacert",
		"",
		"Path to Certificate that should be used while connection establishing",
	)
	flag.StringVar(
		&CABundleDirPath,
		"cadir",
		"",
		"Path to directory with trusted CA certificates",
	)
	flag.BoolVar(
		&MergePlugins,
		"merge-plugins",
		false,
		"Configures the broker to attempt to merge plugins that run in the same sidecar during brokering",
	)
}

// Parse parses configuration.
func Parse() {
	flag.Parse()

	if !DisablePushingToEndpoint {
		// push-endpoint
		if len(PushStatusesEndpoint) == 0 {
			log.Fatal("Push endpoint required(set it with -push-endpoint argument)")
		}
		if !strings.HasPrefix(PushStatusesEndpoint, "ws") {
			log.Fatal("Push endpoint protocol must be either ws or wss")
		}
	}

	// auth-enabled - fetch CHE_MACHINE_TOKEN
	if AuthEnabled {
		Token = os.Getenv("CHE_MACHINE_TOKEN")
	}

	// runtime-id
	if len(runtimeIDRaw) == 0 {
		log.Fatal("Runtime ID required(set it with -runtime-id argument)")
	}
	parts := strings.SplitN(runtimeIDRaw, ":", 3)
	if len(parts) < 3 {
		log.Fatalf("Expected runtime id to be in format 'workspace:env:ownerId'")
	}
	RuntimeID = model.RuntimeID{Workspace: parts[0], Environment: parts[1], OwnerId: parts[2]}
}

// Print prints configuration.
func Print() {
	if PrintEventsOnly {
		return
	}
	log.Print("Broker configuration")
	if !DisablePushingToEndpoint {
		log.Printf("  Push endpoint: %s", PushStatusesEndpoint)
		log.Printf("  Auth enabled: %t", AuthEnabled)
	}
	log.Print("  Runtime ID:")
	log.Printf("    Workspace: %s", RuntimeID.Workspace)
	log.Printf("    Environment: %s", RuntimeID.Environment)
	log.Printf("    OwnerId: %s", RuntimeID.OwnerId)
	if SelfSignedCertificateFilePath != "" {
		log.Printf("  Self signed certificate %s", SelfSignedCertificateFilePath)
	}
	if CABundleDirPath != "" {
		log.Printf("  CA bundle certificates path %s", CABundleDirPath)
	}
}

// ParsePluginFQNs reads content of file at path cfg.Filepath and parses its
// content as a list of fully-qualified Plugin names (id, version, registry).
// If any error occurs, log.Fatal is called.
func ParsePluginFQNs() ([]model.PluginFQN, error) {
	raw, err := readConfigFile()
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %s", err)
	}

	pluginFQNs := make([]model.PluginFQN, 0)
	if err := json.Unmarshal(raw, &pluginFQNs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal plugin details from config: %s", err)
	}
	return pluginFQNs, nil
}

func readConfigFile() ([]byte, error) {
	f, err := os.Open(FilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open config file for reading: %s", err)
	}

	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("Can't close Che plugins metas source, cause: %s", err)
		}
	}()

	raw, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("Failed to read config file: %s", err)
	}
	return raw, nil
}
