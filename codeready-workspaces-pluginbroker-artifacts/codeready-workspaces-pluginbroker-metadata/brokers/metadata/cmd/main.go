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

package main

import (
	"fmt"
	"log"
	"os"

	"github.com/eclipse/che-plugin-broker/brokers/metadata"
	"github.com/eclipse/che-plugin-broker/cfg"
	"github.com/eclipse/che-plugin-broker/common"
)

func main() {
	log.SetOutput(os.Stdout)

	cfg.Parse()
	cfg.Print()

	broker := metadata.NewBroker(cfg.UseLocalhostInPluginUrls)

	common.ConfigureCertPool(cfg.SelfSignedCertificateFilePath, cfg.CABundleDirPath)

	if !cfg.DisablePushingToEndpoint {
		statusTun := common.ConnectOrFail(cfg.PushStatusesEndpoint, cfg.Token)
		broker.PushEvents(statusTun)
	}

	pluginFQNs, err := cfg.ParsePluginFQNs()
	if err != nil {
		message := fmt.Sprintf("Failed to process plugin fully qualified names from config: %s", err)
		broker.PubFailed(message)
		broker.PubLog(message)
		log.Fatal(err)
	}
	err = broker.Start(pluginFQNs, cfg.RegistryAddress)
	if err != nil {
		log.Fatal(err)
	}
}
