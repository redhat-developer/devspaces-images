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
	"fmt"
	"net/url"
	"strings"

	"github.com/sirupsen/logrus"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/client"
	exec_info "github.com/eclipse-che/che-machine-exec/exec-info"
	"github.com/eclipse-che/che-machine-exec/shell"
)

// CmdResolver resolves exec command - MachineExec#Cmd. Needed to patch command
// to apply some features which missed up in the original kubernetes exec api.
type CmdResolver struct {
	shell.ContainerShellDetector
	exec_info.InfoExecCreator
}

// NewCmdResolver creates new instance CmdResolver.
func NewCmdResolver(k8sAPI *client.K8sAPI, namespace string) *CmdResolver {
	shellDetector := shell.NewShellDetector(k8sAPI, namespace)
	infoExecCreator := exec_info.NewKubernetesInfoExecCreator(namespace, k8sAPI.GetClient().CoreV1(), k8sAPI.GetConfig())
	return &CmdResolver{
		ContainerShellDetector: shellDetector,
		InfoExecCreator:        infoExecCreator,
	}
}

// Gets original command from exec model(MachineExec#Cmd) and returns patched command
// to support some features which original kubernetes api doesn't provide.
func (cmdRslv *CmdResolver) ResolveCmd(exec model.MachineExec, containerInfo *model.ContainerInfo) (resolvedCmd []string, err error) {
	var (
		shell, cdCommand string
		cmd              = exec.Cmd
	)

	if cmd == nil {
		cmd = []string{}
	}

	if (exec.Type == "" || exec.Type == "shell") && len(cmd) > 0 {
		shell = cmd[0]
	}

	if shell == "" {
		logrus.Debugf("Cmd is missing. Trying to resolve default shell for container %s/%s",
			containerInfo.PodName, containerInfo.ContainerName)
		if shell, err = cmdRslv.setUpExecShellPath(exec, containerInfo); err != nil {
			return nil, err
		}
	}

	if len(cmd) >= 2 && cmd[1] == "-c" {
		cmd = cmd[2:len(cmd)]
	}
	if len(cmd) == 0 {
		cmd = []string{shell}
	}

	if exec.Cwd != "" {
		if strings.HasPrefix(exec.Cwd, "file://") {
			if res, err := url.Parse(exec.Cwd); err == nil {
				exec.Cwd = res.Path
			}
		}
		cdCommand = fmt.Sprintf("cd %s; ", exec.Cwd)
	}

	return []string{shell, "-c", cdCommand + strings.Join(cmd, " ")}, nil
}

func (cmdRslv *CmdResolver) setUpExecShellPath(exec model.MachineExec, containerInfo *model.ContainerInfo) (shellPath string, err error) {
	if containerShell, err := cmdRslv.DetectShell(containerInfo); err == nil && cmdRslv.shellIsDefined(containerShell) {
		logrus.Debugf("Default shell %s for %s/%s is detected in /etc/passwd", containerShell, containerInfo.PodName, containerInfo.ContainerName)
		return containerShell, nil
	}

	logrus.Debugf("Testing if sh is available in %s/%s", containerInfo.PodName, containerInfo.ContainerName)
	infoExec := cmdRslv.CreateInfoExec([]string{shell.DefaultShell, "-c", "exit 0"}, containerInfo)
	if err := infoExec.Start(); err != nil {
		logrus.Debugf("Sh is not available in %s/%s. Error: %s", containerInfo.PodName, containerInfo.ContainerName, err.Error())
		return "", err
	}

	return shell.DefaultShell, nil
}

func (cmdRslv *CmdResolver) shellIsDefined(shell string) bool {
	if strings.HasSuffix(shell, "nologin") {
		return false
	}
	return true
}
