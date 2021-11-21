//
// Copyright (c) 2019-2021 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package client

import (
	"errors"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/auth"
	"github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// K8sAPI object to access k8s api.
type K8sAPI struct {
	config *rest.Config
	client *kubernetes.Clientset
}

// NewK8sAPI constructor for creation new k8s api access object.
func NewK8sAPI(config *rest.Config, client *kubernetes.Clientset) *K8sAPI {
	return &K8sAPI{config: config, client: client}
}

// GetClient returns k8s client.
func (api *K8sAPI) GetClient() *kubernetes.Clientset {
	return api.client
}

// GetConfig returns k8s config.
func (api *K8sAPI) GetConfig() *rest.Config {
	return api.config
}

// K8sAPIProvider for creation new K8sAPI.
type K8sAPIProvider struct {
	k8sAPI *K8sAPI
}

// NewK8sAPIProvider creates new K8sAPI provider.
func NewK8sAPIProvider() *K8sAPIProvider {
	return &K8sAPIProvider{}
}

// getK8sAPIWithSA returns k8sApi using service account permissions.
func (clientProvider *K8sAPIProvider) getK8sAPIWithSA() (*K8sAPI, error) {
	if clientProvider.k8sAPI == nil {
		config, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		client, err := kubernetes.NewForConfig(config)
		if err != nil {
			return nil, err
		}

		clientProvider.k8sAPI = NewK8sAPI(config, client)
	}

	return clientProvider.k8sAPI, nil
}

// getK8sAPIWithBearerToken returns k8sApi with bearer token.
func (clientProvider *K8sAPIProvider) getK8sAPIWithBearerToken(token string) (*K8sAPI, error) {
	if len(token) == 0 {
		return nil, errors.New("Failed to create k8sAPI. Token must not be empty")
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	config.BearerToken = token
	config.BearerTokenFile = ""

	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return NewK8sAPI(config, client), nil
}

// GetK8sAPI return k8s api object.
func (clientProvider *K8sAPIProvider) GetK8sAPI(machineExec *model.MachineExec) (*K8sAPI, error) {
	if auth.IsEnabled() {
		logrus.Debug("Create k8s api object with bearer token")
		return clientProvider.getK8sAPIWithBearerToken(machineExec.BearerToken)
	}
	logrus.Debug("Create k8s api object with Service Account")
	return clientProvider.getK8sAPIWithSA()
}
