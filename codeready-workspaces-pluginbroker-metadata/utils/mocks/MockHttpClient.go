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

package mocks

import (
	"bytes"
	io "io"
	"net/http"
	"testing/iotest"
)

func NewTestHTTPClient(response *http.Response, err error) *http.Client {
	return &http.Client{
		Transport: MockRoundTripper{response, err},
	}
}

type MockRoundTripper struct {
	response *http.Response
	err      error
}

func (m MockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.response, nil
}

// GenerateResponse generates a mocked *http.Response and returns a function that
// allows checking if this response's body has been closed.
func GenerateResponse(body string, statusCode int, header http.Header) (*http.Response, func() bool) {
	responseBody := &MockResponseBodyImpl{
		reader:   io.Reader(bytes.NewBufferString(body)),
		isClosed: new(bool),
	}
	response := &http.Response{
		Body:       responseBody,
		StatusCode: statusCode,
		Header:     header,
	}
	return response, responseBody.IsClosed
}

// GenerateErrorResponse generates a mocked *http.Response and returns a function
// that allows checking if the body of the response has been closed. The body will
// throw and error when read.
func GenerateErrorResponse(body string, statusCode int) (*http.Response, func() bool) {
	responseBody := &MockResponseBodyImpl{
		reader:   iotest.TimeoutReader(bytes.NewBufferString(body)),
		isClosed: new(bool),
	}
	response := &http.Response{
		Body:       responseBody,
		StatusCode: statusCode,
	}
	return response, responseBody.IsClosed
}

// MockResponseBodyImpl is an implementation of MockResponseBody
type MockResponseBodyImpl struct {
	reader   io.Reader
	isClosed *bool
}

// Read wraps the internal reader's read method.
func (body MockResponseBodyImpl) Read(p []byte) (n int, err error) {
	return body.reader.Read(p)
}

// Close simply sets body.isClosed to true. Useful for checking that response
// body is closed.
func (body MockResponseBodyImpl) Close() error {
	*body.isClosed = true
	return nil
}

// IsClosed returns whether or not Close has been called on this body.
func (body MockResponseBodyImpl) IsClosed() bool {
	return *body.isClosed
}
