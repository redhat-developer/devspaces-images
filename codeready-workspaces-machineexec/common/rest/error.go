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

package rest

type HttpError struct {
	code   int
	errMsg string
}

func NewError(code int, message string) HttpError {
	return HttpError{
		code:   code,
		errMsg: message,
	}
}

func (e HttpError) Error() string {
	return e.errMsg
}
