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

package exec_info

import (
	"github.com/eclipse-che/che-machine-exec/api/model"
)

// InfoExec - exec to spawn some simple not shell based command
// which returns output with some useful information.
type InfoExec interface {
	// Spawn info exec inside container. Return error in
	// case fail exec creation or fail command.
	Start() (err error)
	// Get output with exec command information.
	GetOutput() (output string)
}

// InfoExecCreator - factory for InfoExec creation.
type InfoExecCreator interface {
	// Create new info exec. Return error in case fail.
	CreateInfoExec(command []string, containerInfo *model.ContainerInfo) (infoExec InfoExec)
}
