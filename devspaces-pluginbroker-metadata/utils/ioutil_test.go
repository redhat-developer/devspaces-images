//
// Copyright (c) 2018-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package utils

import (
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"testing"

	"github.com/eclipse/che-plugin-broker/utils/mocks"
	"github.com/stretchr/testify/assert"
)

const expectedResponseBody = "Test body"

func TestIoUtil_Fetch(t *testing.T) {
	type args struct {
		URL string
	}
	type want struct {
		expected  []byte
		errRegexp *regexp.Regexp
	}
	type clientMocks struct {
		response *http.Response
		isClosed func() bool
		err      error
	}

	generateMocks := func(body string, status int, header http.Header, err error, failRequest bool) clientMocks {
		var response *http.Response
		var isClosed func() bool
		if failRequest {
			response, isClosed = mocks.GenerateErrorResponse(body, status)
		} else {
			response, isClosed = mocks.GenerateResponse(body, status, header)
		}
		return clientMocks{
			response: response,
			err:      err,
			isClosed: isClosed,
		}
	}

	tests := []struct {
		name  string
		args  args
		mocks clientMocks
		want  want
	}{
		{
			name: "Returns error when Get returns error",
			args: args{
				URL: "test.url",
			},
			want: want{
				expected:  nil,
				errRegexp: regexp.MustCompile("failed to get data from .*"),
			},
			mocks: generateMocks("testBody", http.StatusForbidden, http.Header{}, errors.New("TestError"), false),
		},
		{
			name: "Returns error when http request not status OK",
			args: args{
				URL: "test.url",
			},
			want: want{
				expected:  nil,
				errRegexp: regexp.MustCompile("Downloading .* failed. Status code .*"),
			},
			mocks: generateMocks("testBody", http.StatusForbidden, http.Header{}, nil, false),
		},
		{
			name: "Returns error when read body results in error",
			args: args{
				URL: "test.url",
			},
			want: want{
				expected:  nil,
				errRegexp: regexp.MustCompile("failed to read response body: .*"),
			},
			mocks: generateMocks("testBody", http.StatusOK, http.Header{}, nil, true),
		},
		{
			name: "Returns data from response",
			args: args{
				URL: "test.url",
			},
			want: want{
				expected:  []byte(expectedResponseBody),
				errRegexp: nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{}, nil, false),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			util := &impl{
				mocks.NewTestHTTPClient(tt.mocks.response, tt.mocks.err),
			}
			actual, err := util.Fetch(tt.args.URL)
			if tt.want.errRegexp != nil {
				assertErrorMatches(t, tt.want.errRegexp, err)
				return
			}
			assert.NoError(t, err)
			if tt.want.expected != nil {
				assert.Equal(t, tt.want.expected, actual)
			}
			if !tt.mocks.isClosed() {
				t.Errorf("Should close response body")
			}
		})
	}
}

func assertErrorMatches(t *testing.T, expected *regexp.Regexp, actual error) {
	if actual == nil {
		t.Errorf("Expected error %s but got nil", expected.String())
	} else if !expected.MatchString(actual.Error()) {
		t.Errorf("Error message does not match. Expected '%s' but got '%s'", expected.String(), actual.Error())
	}
}

func TestIoUtil_Download(t *testing.T) {
	type args struct {
		URL                   string
		useContentDisposition bool
	}
	type want struct {
		downloadedPath string
		errRegexp      *regexp.Regexp
	}
	type clientMocks struct {
		response *http.Response
		isClosed func() bool
		err      error
	}

	workingDir, err := ioutil.TempDir("", "broker-tests-")
	if err != nil {
		panic(err)
	}
	defer os.RemoveAll(workingDir)

	generateMocks := func(body string, status int, header http.Header, err error, failRequest bool) clientMocks {
		var response *http.Response
		var isClosed func() bool
		if failRequest {
			response, isClosed = mocks.GenerateErrorResponse(body, status)
		} else {
			response, isClosed = mocks.GenerateResponse(body, status, header)
		}
		return clientMocks{
			response: response,
			err:      err,
			isClosed: isClosed,
		}
	}

	tests := []struct {
		name  string
		args  args
		mocks clientMocks
		want  want
	}{
		{
			name: "Returns error when Get returns error",
			args: args{
				URL: "test.url",
			},
			want: want{
				downloadedPath: "",
				errRegexp:      regexp.MustCompile(`Get "test.url": TestError`),
			},
			mocks: generateMocks("testBody", http.StatusForbidden, http.Header{}, errors.New("TestError"), false),
		},
		{
			name: "Returns error when http request not status OK",
			args: args{
				URL: "test.url",
			},
			want: want{
				downloadedPath: "",
				errRegexp:      regexp.MustCompile("Downloading .* failed. Status code .*"),
			},
			mocks: generateMocks("testBody", http.StatusForbidden, http.Header{}, nil, false),
		},
		{
			name: "Returns error when read body results in error",
			args: args{
				URL: "test.url",
			},
			want: want{
				downloadedPath: "",
				errRegexp:      regexp.MustCompile("timeout"),
			},
			mocks: generateMocks("testBody", http.StatusOK, http.Header{}, nil, true),
		},
		{
			name: "Download file without using Content-Disposition",
			args: args{
				URL: "test.url",
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{}, nil, false),
		},
		{
			name: "Download file using Content-Disposition",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "content-disposition-filename"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\"content-disposition-filename\""},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition and clean filename",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "content-disposition-filename"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\"anyDir//../anyOtherDir/content-disposition-filename\""},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but without the header",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but with weird header value",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"very strange value ++ ; /"},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but with when filename ends with /",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\"content-disposition-filename/\""},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but with when filename ends with 0 char",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\"content-disposition-filename\x00\""},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but with when filename is '/'",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\"/\""},
			}, nil, false),
		},
		{
			name: "Download file using Content-Disposition, but with when filename is '.'",
			args: args{
				URL:                   "test.url",
				useContentDisposition: true,
			},
			want: want{
				downloadedPath: filepath.Join(workingDir, "test.url"),
				errRegexp:      nil,
			},
			mocks: generateMocks(expectedResponseBody, http.StatusOK, http.Header{
				"Content-Disposition": {"attachment; filename=\".\""},
			}, nil, false),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			util := &impl{
				mocks.NewTestHTTPClient(tt.mocks.response, tt.mocks.err),
			}
			actual, err := util.Download(tt.args.URL, filepath.Join(workingDir, "test.url"), tt.args.useContentDisposition)
			if tt.want.errRegexp != nil {
				assertErrorMatches(t, tt.want.errRegexp, err)
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, tt.want.downloadedPath, actual)
			if !tt.mocks.isClosed() {
				t.Errorf("Should close response body")
			}
		})
	}
}
