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

package filter

import "github.com/eclipse-che/che-machine-exec/api/model"

// Container filter to find container information if it's possible by unique Che specific container name.
type ContainerFilter interface {
	// Return list Che workspace containers.
	GetContainerList() (containersInfo []*model.ContainerInfo, err error)

	// Find container information by Che specific container identifier.
	// Return error in case fail filter operation.
	FindContainerInfo(identifier *model.MachineIdentifier) (containerInfo *model.ContainerInfo, err error)
}
