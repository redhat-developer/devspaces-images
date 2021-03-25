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

package artifacts

import (
	"fmt"
	"testing"

	"github.com/eclipse/che-plugin-broker/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestProcessPluginDoesNothingWhenNoExtensions(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)

	plugin := model.CachedPlugin{
		ID:               "testPlugin",
		IsRemote:         true,
		CachedExtensions: map[string]string{},
	}

	output := m.broker.ProcessPlugin(&plugin)

	assert.Nil(t, output)
	m.ioUtils.AssertNotCalled(t, "Download", mock.Anything, mock.Anything, mock.Anything)
}

func TestProcessPluginSuccessfulCase(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("testArchivePath", nil)
	m.ioUtils.On("MkDir", mock.AnythingOfType("string")).Return(nil)
	m.ioUtils.On("CopyFile", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	m.rand.On("String", mock.AnythingOfType("int")).Return("randstr")

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"testUrl": "",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.Nil(t, err)
}

func TestProcessPluginHandlesPartiallyCachedPlugin(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("testArchivePath", nil)
	m.ioUtils.On("MkDir", mock.AnythingOfType("string")).Return(nil)
	m.ioUtils.On("CopyFile", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	m.rand.On("String", mock.AnythingOfType("int")).Return("randstr")

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"alreadyCached": "alreadyCached",
			"testUrl":       "",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.Nil(t, err)
	m.ioUtils.AssertNotCalled(t, "Download", "alreadyCached", mock.Anything, mock.Anything)
}

func TestProcessPluginIgnoresCachedPlugins(t *testing.T) {
	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("testArchivePath", nil)
	m.ioUtils.On("MkDir", mock.AnythingOfType("string")).Return(nil)
	m.ioUtils.On("CopyFile", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	m.rand.On("String", mock.AnythingOfType("int")).Return("randstr")

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"testUrl": "existingPathToPlugin",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.Nil(t, err)
	m.ioUtils.AssertNotCalled(t, "Download", mock.Anything, mock.Anything, mock.Anything)
	m.ioUtils.AssertNotCalled(t, "MkDir", mock.Anything)
	m.ioUtils.AssertNotCalled(t, "CopyFile", mock.Anything, mock.Anything)
}

func TestProcessPluginFailureOnDownload(t *testing.T) {
	testError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("", testError)

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"testUrl": "",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "failed to download plugin from testUrl: test error")
}

func TestProcessPluginFailureOnMkdir(t *testing.T) {
	testError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("testArchivePath", nil)
	m.ioUtils.On("MkDir", mock.AnythingOfType("string")).Return(testError)

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"testUrl": "",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "test error")
}

func TestProcessPluginFailureOnCopyFile(t *testing.T) {
	testError := fmt.Errorf("test error")

	m := initMocks()
	m.ioUtils.On("TempDir", mock.Anything, mock.Anything).Return("testDir", nil)
	m.ioUtils.On("ResolveDestPathFromURL", "testUrl", "testDir").Return("testDestPath")
	m.ioUtils.On("Download", "testUrl", "testDestPath", mock.AnythingOfType("bool")).Return("testArchivePath", nil)
	m.ioUtils.On("MkDir", mock.AnythingOfType("string")).Return(nil)
	m.rand.On("String", mock.AnythingOfType("int")).Return("randstr")
	m.ioUtils.On("CopyFile", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(testError)

	plugin := model.CachedPlugin{
		ID:       "testPlugin",
		IsRemote: true,
		CachedExtensions: map[string]string{
			"testUrl": "",
		},
	}

	err := m.broker.ProcessPlugin(&plugin)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "test error")
}
