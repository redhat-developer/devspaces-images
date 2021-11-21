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

package exec

import (
	"os"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/client"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

var execManager ExecManager

// ExecManager to manage exec life cycle.
type ExecManager interface {
	// Resolve resolves exec info
	// the first container with available shell will be picked up if omit
	Resolve(container, token string) (*model.ResolvedExec, error)

	// Create new Exec defined by machine exec model object.
	Create(machineExec *model.MachineExec) (int, error)

	// Remove information about exec by ExecId.
	// It's can be useful in case exec error or exec exit.
	Remove(execId int)

	// Check if exec with current id is exists
	Check(id int) (int, error)

	// Attach simple websocket connection to the exec stdIn/stdOut by unique exec id.
	Attach(id int, conn *websocket.Conn) error

	// Resize exec by unique id.
	Resize(id int, cols uint, rows uint) error

	// Create a kubeconfig
	CreateKubeConfig(kubeConfigParams *model.KubeConfigParams, containerInfo *model.ContainerInfo) error

	// List available containers
	ListAvailableContainers(machineExec *model.MachineExec) ([]*model.ContainerInfo, error)
}

// CreateExecManager creates and returns new instance ExecManager.
// Fail with panic if it is impossible.
func CreateExecManager() (exeManager ExecManager) {
	if isValidKubernetesInfra() {
		namespace := GetNamespace()
		k8sAPIProvider := client.NewK8sAPIProvider()
		return NewK8sExecManager(namespace, *k8sAPIProvider)
	}

	logrus.Panic("Error: Unable to create manager. Unable to get service account info.")

	return nil
}

// GetExecManager returns instance exec manager
func GetExecManager() ExecManager {
	if execManager == nil {
		execManager = CreateExecManager()
	}
	return execManager
}

func isValidKubernetesInfra() bool {
	stat, err := os.Stat("/var/run/secrets/kubernetes.io/serviceaccount")
	if err == nil && stat.IsDir() {
		return true
	}

	return false
}
