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

package ws_conn

import (
	ws "github.com/gorilla/websocket"
)

// Return true if err is normal close connection error(connection close client). Return false otherwise.
// Note: In case if connection was close normally by client it's ok for us, we should not log error.
func IsClosedByClientError(err error) bool {
	normalCloseCodes := []int{ws.CloseGoingAway, ws.CloseNormalClosure, ws.CloseNoStatusReceived}
	if closeErr, ok := err.(*ws.CloseError); ok {
		for _, code := range normalCloseCodes {
			if closeErr.Code == code {
				return true
			}
		}
	}
	return false
}
