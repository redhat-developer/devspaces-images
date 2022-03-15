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
	"errors"
	"testing"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/mocks"
	"github.com/eclipse-che/che-machine-exec/shell"
	"github.com/stretchr/testify/assert"
)

var (
	containerInfo = &model.ContainerInfo{}
)

func TestShoudBeLaunchedShellProcessWithCwd(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-c", "sleep 5 && echo 'ABC' && ls -a -li && pwd"},
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "cd /projects/testprj; sleep 5 && echo 'ABC' && ls -a -li && pwd"}, resolvedCmd)
}

func TestShoudBeLaunchedShellProcessWithoutCwd(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-c", "sleep 5 && echo 'ABC' && ls -a -li && pwd"},
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "sleep 5 && echo 'ABC' && ls -a -li && pwd"}, resolvedCmd)
}

func TestShouldBeLaunchedTerminalProcessWithCwd(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-l"},
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "cd /projects/testprj; sh -l"}, resolvedCmd)
}

func TestShouldBeLaunchedTerminalProcessWithoutCwd(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-l"},
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "sh -l"}, resolvedCmd)
}

func TestShouldBedAutoDetectedShellForTerminalCommandWithCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("bash", nil)
	exec := model.MachineExec{
		Type: "shell",
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"bash", "-c", "cd /projects/testprj; bash"}, resolvedCmd)
}

func TestShouldBeAutoDetectedShellForTerminalCommandWithoutCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("bash", nil)

	exec := model.MachineExec{
		Type: "shell",
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"bash", "-c", "bash"}, resolvedCmd)
}

func TestShouldBeResolvedCwdLikeUriForShellCommand(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-c", "mvn clean install"},
		Cwd:  "file:///projects/testprj",
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "cd /projects/testprj; mvn clean install"}, resolvedCmd)
}

func TestShouldBeResolvedCwdLikeUriForTerminalCommand(t *testing.T) {
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"sh", "-l"},
		Cwd:  "file:///projects/testprj",
	}

	cmdResolver := &CmdResolver{&mocks.ContainerShellDetector{}, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "cd /projects/testprj; sh -l"}, resolvedCmd)
}

func TestShouldBeAutoDetectedShellForShellCommandWithCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("zsh", nil)
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"", "-c", "top"},
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"zsh", "-c", "cd /projects/testprj; top"}, resolvedCmd)
}

func TestShouldBeAutoDetectShellForShellCommandWithoutCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("zsh", nil)
	exec := model.MachineExec{
		Type: "shell",
		Cmd:  []string{"", "-c", "top"},
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"zsh", "-c", "cd /projects/testprj; top"}, resolvedCmd)
}

func TestShouldBeLaunchedNonShellCommandWithCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("zsh", nil)
	exec := model.MachineExec{
		Type: "process",
		Cmd:  []string{"yarn", "run", "build"},
		Cwd:  "/projects/testprj",
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"zsh", "-c", "cd /projects/testprj; yarn run build"}, resolvedCmd)
}

func TestShouldBeLaunchedNonShellCommandWithoutCwd(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("zsh", nil)
	exec := model.MachineExec{
		Type: "process",
		Cmd:  []string{"yarn", "run", "build"},
	}

	cmdResolver := &CmdResolver{shellDetectorMock, &mocks.InfoExecCreator{}}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"zsh", "-c", "yarn run build"}, resolvedCmd)
}

func TestShouldUseDefaultShellToLaunchCommandWithoutCwdWhenShellIsNotDefined(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("/sbin/nologin", nil)
	exec := model.MachineExec{
		Type: "process",
		Cmd:  []string{"yarn", "run", "build"},
	}
	infoExecCreatorMock := &mocks.InfoExecCreator{}
	infoExecMock := &mocks.InfoExec{}
	infoExecCreatorMock.On("CreateInfoExec", []string{shell.DefaultShell, "-c", "exit 0"}, containerInfo).Return(infoExecMock)
	infoExecMock.On("Start").Return(nil)

	cmdResolver := &CmdResolver{shellDetectorMock, infoExecCreatorMock}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "yarn run build"}, resolvedCmd)
}

func TestShouldUseDefaultShellToLaunchCommandWithCwdWhenShellIsNotDefined(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("/sbin/nologin", nil)
	exec := model.MachineExec{
		Type: "process",
		Cmd:  []string{"yarn", "run", "build"},
		Cwd:  "/projects/testprj",
	}
	infoExecCreatorMock := &mocks.InfoExecCreator{}
	infoExecMock := &mocks.InfoExec{}
	infoExecCreatorMock.On("CreateInfoExec", []string{shell.DefaultShell, "-c", "exit 0"}, containerInfo).Return(infoExecMock)
	infoExecMock.On("Start").Return(nil)

	cmdResolver := &CmdResolver{shellDetectorMock, infoExecCreatorMock}
	resolvedCmd, _ := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, []string{"sh", "-c", "cd /projects/testprj; yarn run build"}, resolvedCmd)
}

func TestThrowAnErrorWhenEvenDefaultShellDoesNotWork(t *testing.T) {
	shellDetectorMock := &mocks.ContainerShellDetector{}
	shellDetectorMock.On("DetectShell", containerInfo).Return("/sbin/nologin", nil)
	exec := model.MachineExec{
		Type: "process",
		Cmd:  []string{"yarn", "run", "build"},
		Cwd:  "/projects/testprj",
	}

	err := errors.New("Some error")

	infoExecCreatorMock := &mocks.InfoExecCreator{}
	infoExecMock := &mocks.InfoExec{}
	infoExecCreatorMock.On("CreateInfoExec", []string{shell.DefaultShell, "-c", "exit 0"}, containerInfo).Return(infoExecMock)
	infoExecMock.On("Start").Return(err)

	cmdResolver := &CmdResolver{shellDetectorMock, infoExecCreatorMock}
	_, actualErr := cmdResolver.ResolveCmd(exec, containerInfo)

	assert.Equal(t, err, actualErr)
}
