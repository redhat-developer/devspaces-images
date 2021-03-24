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

package events

import (
	"github.com/eclipse/che-go-jsonrpc"
	"github.com/eclipse/che-go-jsonrpc/event"
	"github.com/sirupsen/logrus"
)

// Event bus to send events with information about execs to the clients.
var EventBus = event.NewBus()

// Exec Event consumer to send exec events to the clients with help json-rpc tunnel.
// INFO: Tunnel it's one of the active json-rpc connection.
type ExecEventConsumer struct {
	event.Consumer
	Tunnel *jsonrpc.Tunnel
}

// Send event to the client with help json-rpc tunnel.
func (execConsumer *ExecEventConsumer) Accept(event event.E) {
	if !execConsumer.Tunnel.IsClosed() {
		if err := execConsumer.Tunnel.Notify(event.Type(), event); err != nil {
			logrus.Errorln("Unable to send event to the tunnel: ", execConsumer.Tunnel.ID(), "Cause: ", err.Error())
		}
	}
}
