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

package utils

import (
	"io/ioutil"
	"log"
	"net/http"
)

type HTTPError struct {
	StatusCode int
	Body       string
	errMsg     string
}

func (e *HTTPError) Error() string {
	return e.errMsg
}

func NewHTTPError(resp *http.Response, errMsg string) *HTTPError {
	var bodyContent string
	bytes, err := ioutil.ReadAll(resp.Body)
	if err == nil {
		bodyContent = string(bytes)
	} else {
		log.Print(err)
	}
	return &HTTPError{
		StatusCode: resp.StatusCode,
		Body:       bodyContent,
		errMsg:     errMsg,
	}
}
