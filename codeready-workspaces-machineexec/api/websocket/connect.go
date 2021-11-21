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

package websocket

import (
	"github.com/eclipse-che/che-machine-exec/api/events"
	execRpc "github.com/eclipse-che/che-machine-exec/api/jsonrpc"
	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/auth"
	"github.com/eclipse-che/che-machine-exec/common/rest"
	jsonrpc "github.com/eclipse/che-go-jsonrpc"
	"github.com/eclipse/che-go-jsonrpc/jsonrpcws"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func HandleConnect(c *gin.Context) {
	var token string
	if auth.IsEnabled() {
		var err error
		token, err = auth.Authenticate(c)
		if err != nil {
			rest.WriteErrorResponse(c, err)
			return
		}
	}

	conn, err := jsonrpcws.Upgrade(c.Writer, c.Request)
	if err != nil {
		c.JSON(c.Writer.Status(), err.Error())
		return
	}

	logrus.Debug("Create json-rpc channel for new websocket connection")
	tunnel := jsonrpc.NewManagedTunnel(conn)

	if len(token) > 0 {
		tunnel.Attributes[execRpc.BearerTokenAttr] = token
	}

	execConsumer := &events.ExecEventConsumer{Tunnel: tunnel}
	events.EventBus.SubAny(execConsumer, model.OnExecError, model.OnExecExit)

	tunnel.SayHello()
}
