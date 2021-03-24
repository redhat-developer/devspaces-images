//
// Copyright (c) 2012-2019 Red Hat, Inc.
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
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestShouldParseUID(t *testing.T) {
	uidContent = "1000\n"

	uidExecInfoParser := &execInfoParser{}
	uid, err := uidExecInfoParser.ParseUID(uidContent)

	assert.Nil(t, err)
	assert.Equal(t, "1000", uid)
}

func TestShouldFailParseUID1(t *testing.T) {
	uidContent = "Some error\n"

	shellInfoParser := &execInfoParser{}
	uid, err := shellInfoParser.ParseUID(uidContent)

	assert.NotNil(t, err)
	assert.Equal(t, "", uid)
}

func TestShouldFailParseUIDWithEmptyContent(t *testing.T) {
	uidContent = ""

	shellExecInfoParser := &execInfoParser{}
	uid, err := shellExecInfoParser.ParseUID(uidContent)

	assert.NotNil(t, err)
	assert.Equal(t, "", uid)
}

func TestShouldParseShellFromEtcPassWd(t *testing.T) {
	etcPasswdContent := "user:x:1000:1000:user,,,:/home/user:/bin/bash\n" +
		"nvidia-persistenced:x:121:127:NVIDIA Persistence Daemon,,,:/nonexistent:/sbin/nologin\n" +
		"libvirt-qemu:x:64055:128:Libvirt Qemu,,,:/var/lib/libvirt:/usr/sbin/nologin\n" +
		"libvirt-dnsmasq:x:122:131:Libvirt Dnsmasq,,,:/var/lib/libvirt/dnsmasq:/usr/sbin/nologin"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "/bin/bash", shell)
	assert.Nil(t, err)
}

func TestShouldParseShellFromEtcPassWd2(t *testing.T) {
	etcPasswdContent := "nvidia-persistenced:x:121:127:NVIDIA Persistence Daemon,,,:/nonexistent:/sbin/nologin\n" +
		"libvirt-qemu:x:64055:128:Libvirt Qemu,,,:/var/lib/libvirt:/usr/sbin/nologin\n" +
		"user:x:1000:1000:user,,,:/home/user:/bin/bash\n" +
		"libvirt-dnsmasq:x:122:131:Libvirt Dnsmasq,,,:/var/lib/libvirt/dnsmasq:/usr/sbin/nologin"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "/bin/bash", shell)
	assert.Nil(t, err)
}

func TestShouldParseShellFromEtcPassWd3(t *testing.T) {
	etcPasswdContent := "nvidia-persistenced:x:121:127:NVIDIA Persistence Daemon,,,:/nonexistent:/sbin/nologin\n" +
		"libvirt-qemu:x:64055:128:Libvirt Qemu,,,:/var/lib/libvirt:/usr/sbin/nologin\n" +
		"root:x:0:0:root:/root:/bin/bash" +
		"user:x:1000:1000:user,,,:/home/user:/bin/bash\n"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "/bin/bash", shell)
	assert.Nil(t, err)
}

func TestShouldFailParseShellBecauseEmptyValue(t *testing.T) {
	etcPasswdContent := "nvidia-persistenced:x:121:127:NVIDIA Persistence Daemon,,,:/nonexistent:/sbin/nologin\n" +
		"libvirt-qemu:x:64055:128:Libvirt Qemu,,,:/var/lib/libvirt:/usr/sbin/nologin\n" +
		"root:x:0:0:root:/root:/bin/bash" +
		"user:x:1000:1000:user,,,:/home/user:\n"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "", shell)
	assert.NotNil(t, err)
}

func TestShouldFailParseShellFromEtcPasswdBecauseUIDIsNotExists(t *testing.T) {
	etcPasswdContent := "nvidia-persistenced:x:121:127:NVIDIA Persistence Daemon,,,:/nonexistent:/sbin/nologin\n" +
		"libvirt-qemu:x:64055:128:Libvirt Qemu,,,:/var/lib/libvirt:/usr/sbin/nologin\n" +
		"root:x:0:0:root:/root:/bin/bash" +
		"user:x:1002:1000:user,,,:/home/user:/bin/bash\n"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "", shell)
	assert.NotNil(t, err)
}

func TestShouldFailParseShellFromEtcPasswd(t *testing.T) {
	etcPasswdContent := "Some error"
	uid := "1000"

	shellExecInfoParser := &execInfoParser{}
	shell, err := shellExecInfoParser.ParseShellFromEtcPassWd(etcPasswdContent, uid)

	assert.Equal(t, "", shell)
	assert.NotNil(t, err)
}
