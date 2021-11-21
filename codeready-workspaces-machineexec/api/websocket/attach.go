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
	"errors"
	"net/http"
	"strconv"

	"github.com/eclipse-che/che-machine-exec/auth"
	"github.com/eclipse-che/che-machine-exec/common/rest"
	"github.com/eclipse-che/che-machine-exec/exec"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func HandleAttach(c *gin.Context) {
	if auth.IsEnabled() {
		_, err := auth.Authenticate(c)
		if err != nil {
			rest.WriteErrorResponse(c, err)
			return
		}
	}

	if err := doAttach(c.Writer, c.Request, c.Param("id")); err != nil {
		c.JSON(c.Writer.Status(), err.Error())
	}
}

func doAttach(w http.ResponseWriter, r *http.Request, idParam string) error {
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return errors.New("failed to parse id")
	}

	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logrus.Errorln("Unable to upgrade connection to ws-conn " + err.Error())
		return err
	}

	if err = exec.GetExecManager().Attach(id, wsConn); err != nil {
		logrus.Errorln("Attach to exec", strconv.Itoa(id), " failed. Cause:  ", err.Error())
		return err
	}

	return nil
}
