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

package rest

import (
	"github.com/eclipse-che/che-machine-exec/api/model"
)

func HandleKubeConfigCreation(kubeConfigParams *model.KubeConfigParams, containerInfo *model.ContainerInfo) error {
	if kubeConfigParams.Username == "" {
		kubeConfigParams.Username = "Developer"
	}

	err := execManager.CreateKubeConfig(kubeConfigParams, containerInfo)
	return err
}
