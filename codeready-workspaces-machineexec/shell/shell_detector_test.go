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

package shell

import (
	"fmt"
	"testing"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/mocks"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
)

var (
	shell            = "/bin/bash"
	uidContent       = "1000\n"
	parsedUID        = "1000"
	containerInfo    = &model.ContainerInfo{}
	etcPasswdContent = "user:x:1000:1000:user,,,:/home/user:/bin/bash"
	testErr          = errors.New("some error")
)

func TestShouldDetectDefaultShellWithHelpInfoExecs(t *testing.T) {
	execInfoParser := &mocks.ExecInfoParser{}
	execInfoCreator := &mocks.InfoExecCreator{}
	uidExecInfo := &mocks.InfoExec{}
	etcPasswdExecInfo := &mocks.InfoExec{}

	execInfoCreator.On("CreateInfoExec", []string{"id", "-u"}, containerInfo).Return(uidExecInfo)
	execInfoCreator.On("CreateInfoExec", []string{"cat", "/etc/passwd"}, containerInfo).Return(etcPasswdExecInfo)
	uidExecInfo.On("Start").Return(nil)
	uidExecInfo.On("GetOutput").Return(uidContent)
	execInfoParser.On("ParseUID", uidContent).Return(parsedUID, nil)
	etcPasswdExecInfo.On("Start").Return(nil)
	etcPasswdExecInfo.On("GetOutput").Return(etcPasswdContent)
	execInfoParser.On("ParseShellFromEtcPassWd", etcPasswdContent, parsedUID).Return(shell, nil)

	shellDetector := &ShellDetector{InfoExecCreator: execInfoCreator, ExecInfoParser: execInfoParser}
	shell, err := shellDetector.DetectShell(containerInfo)
	fmt.Println(shell, err)

	assert.Nil(t, err)
	assert.Equal(t, "/bin/bash", shell)

	execInfoParser.AssertExpectations(t)
	execInfoCreator.AssertExpectations(t)
}

func TestShowRethrowErrorFromUserIDInfoExecOnStart(t *testing.T) {
	execInfoParser := &mocks.ExecInfoParser{}
	execInfoCreator := &mocks.InfoExecCreator{}
	uidExecInfo := &mocks.InfoExec{}

	execInfoCreator.On("CreateInfoExec", []string{"id", "-u"}, containerInfo).Return(uidExecInfo)

	uidExecInfo.On("Start").Return(testErr)

	shellDetector := &ShellDetector{InfoExecCreator: execInfoCreator, ExecInfoParser: execInfoParser}
	shell, err := shellDetector.DetectShell(containerInfo)

	assert.NotNil(t, err)
	assert.Equal(t, testErr, err)
	assert.Equal(t, "", shell)

	execInfoParser.AssertExpectations(t)
	execInfoCreator.AssertExpectations(t)
}

func TestShouldRethrowErrorOnParseUID(t *testing.T) {
	execInfoParser := &mocks.ExecInfoParser{}
	execInfoCreator := &mocks.InfoExecCreator{}
	uidExecInfo := &mocks.InfoExec{}

	execInfoCreator.On("CreateInfoExec", []string{"id", "-u"}, containerInfo).Return(uidExecInfo)

	uidExecInfo.On("Start").Return(nil)
	uidExecInfo.On("GetOutput").Return(uidContent)
	execInfoParser.On("ParseUID", uidContent).Return("", testErr)

	shellDetector := &ShellDetector{InfoExecCreator: execInfoCreator, ExecInfoParser: execInfoParser}
	shell, err := shellDetector.DetectShell(containerInfo)

	assert.NotNil(t, err)
	assert.Equal(t, testErr, err)
	assert.Equal(t, "", shell)

	execInfoParser.AssertExpectations(t)
	execInfoCreator.AssertExpectations(t)
}

func TestShowRethrowErrorFromEtcPasswdContentInfoExecOnStart(t *testing.T) {
	execInfoParser := &mocks.ExecInfoParser{}
	execInfoCreator := &mocks.InfoExecCreator{}
	uidExecInfo := &mocks.InfoExec{}
	etcPasswdExecInfo := &mocks.InfoExec{}

	execInfoCreator.On("CreateInfoExec", []string{"id", "-u"}, containerInfo).Return(uidExecInfo)
	execInfoCreator.On("CreateInfoExec", []string{"cat", "/etc/passwd"}, containerInfo).Return(etcPasswdExecInfo)

	uidExecInfo.On("Start").Return(nil)
	uidExecInfo.On("GetOutput").Return(uidContent)
	execInfoParser.On("ParseUID", uidContent).Return(parsedUID, nil)
	etcPasswdExecInfo.On("Start").Return(testErr)

	shellDetector := &ShellDetector{InfoExecCreator: execInfoCreator, ExecInfoParser: execInfoParser}
	shell, err := shellDetector.DetectShell(containerInfo)

	assert.NotNil(t, err)
	assert.Equal(t, testErr, err)
	assert.Equal(t, "", shell)

	execInfoParser.AssertExpectations(t)
	execInfoCreator.AssertExpectations(t)
}

func TestShouldRethrowErrorOnParseEtcPasswdShellByUID(t *testing.T) {
	execInfoParser := &mocks.ExecInfoParser{}
	execInfoCreator := &mocks.InfoExecCreator{}
	uidExecInfo := &mocks.InfoExec{}
	etcPasswdExecInfo := &mocks.InfoExec{}

	execInfoCreator.On("CreateInfoExec", []string{"id", "-u"}, containerInfo).Return(uidExecInfo)
	execInfoCreator.On("CreateInfoExec", []string{"cat", "/etc/passwd"}, containerInfo).Return(etcPasswdExecInfo)

	uidExecInfo.On("Start").Return(nil)
	uidExecInfo.On("GetOutput").Return(uidContent)
	execInfoParser.On("ParseUID", uidContent).Return(parsedUID, nil)
	etcPasswdExecInfo.On("Start").Return(nil)
	etcPasswdExecInfo.On("GetOutput").Return(etcPasswdContent)
	execInfoParser.On("ParseShellFromEtcPassWd", etcPasswdContent, parsedUID).Return("", testErr)

	shellDetector := &ShellDetector{InfoExecCreator: execInfoCreator, ExecInfoParser: execInfoParser}
	shell, err := shellDetector.DetectShell(containerInfo)

	assert.NotNil(t, err)
	assert.Equal(t, testErr, err)
	assert.Equal(t, "", shell)

	execInfoParser.AssertExpectations(t)
	execInfoCreator.AssertExpectations(t)
}
