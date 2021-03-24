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
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
	"sync"
	"time"
)

const (
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)

// Websocket connection handler is connection storage.
// For che-machine-exec it used to manage connections with exec input/output.
type ConnectionHandler interface {
	// Add new websocket connection.
	ReadConnection(wsConn *websocket.Conn, inputChan chan []byte)
	// Send data to the client websocket connections.
	WriteDataToWsConnections(data []byte)

	// Close all connection.
	CloseConnections()
}

// Connection handler implementation.
type ConnectionHandlerImpl struct {
	wsConnsLock *sync.Mutex
	wsConns     []*websocket.Conn
}

// Create new implementation connection handler.
func NewConnHandler() *ConnectionHandlerImpl {
	return &ConnectionHandlerImpl{
		wsConnsLock: &sync.Mutex{},
		wsConns:     make([]*websocket.Conn, 0),
	}
}

// Add new connection to handler.
func (handler *ConnectionHandlerImpl) ReadConnection(wsConn *websocket.Conn, inputChan chan []byte) {
	defer handler.wsConnsLock.Unlock()
	handler.wsConnsLock.Lock()

	handler.wsConns = append(handler.wsConns, wsConn)

	go handler.readDataFromConnection(inputChan, wsConn)
	go handler.sendPingMessage(wsConn)
}

// Remove connection form handler.
func (handler *ConnectionHandlerImpl) removeConnection(wsConn *websocket.Conn) {
	defer handler.wsConnsLock.Unlock()
	handler.wsConnsLock.Lock()

	for index, wsConnElem := range handler.wsConns {
		if wsConnElem == wsConn {
			handler.wsConns = append(handler.wsConns[:index], handler.wsConns[index+1:]...)
		}
	}
}

// Write data to the all connections managed by handler.
func (handler *ConnectionHandlerImpl) WriteDataToWsConnections(data []byte) {
	defer handler.wsConnsLock.Unlock()
	handler.wsConnsLock.Lock()

	workingConns := make([]*websocket.Conn, 0)

	for _, wsConn := range handler.wsConns {
		if err := wsConn.WriteMessage(websocket.TextMessage, data); err != nil {
			if !IsClosedByClientError(err) {
				logrus.Errorf("failed to write to ws-conn message. Cause: %v", err)
			}
		} else {
			workingConns = append(workingConns, wsConn)
		}
	}
	handler.wsConns = workingConns
}

// Read data from connection.
func (handler *ConnectionHandlerImpl) readDataFromConnection(inputChan chan []byte, wsConn *websocket.Conn) {
	defer handler.removeConnection(wsConn)

	for {
		wsConn.SetPongHandler(func(string) error { return wsConn.SetReadDeadline(time.Now().Add(pongWait)) })
		msgType, wsBytes, err := wsConn.ReadMessage()
		if err != nil {
			if !IsClosedByClientError(err) {
				logrus.Errorf("failed to read ws-conn message. Cause: %v", err)
			}
			return
		}

		if msgType != websocket.TextMessage {
			continue
		}

		inputChan <- wsBytes
	}
}

// Send ping message to the connection client.
func (*ConnectionHandlerImpl) sendPingMessage(wsConn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for range ticker.C {
		if err := wsConn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
			// stop sending ping messages if one failed
			break
		}
	}
}

func (handler *ConnectionHandlerImpl) CloseConnections() {
	defer handler.wsConnsLock.Unlock()
	handler.wsConnsLock.Lock()

	for _, wsConn := range handler.wsConns {
		if err := wsConn.Close(); err != nil {
			logrus.Errorf("failed to close connection. Cause: %v", err)
		}
	}
	handler.wsConns = make([]*websocket.Conn, 0)
}
