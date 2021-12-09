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

package main

import (
	"context"
	"encoding/json"
	"github.com/che-incubator/workspace-data-sync/pkg/progress"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	pw, err := progress.CmdWithProgressWatching("/bin/sh", "/scripts/restore.sh")
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		pw.Watch()
	}()

	http.HandleFunc("/track", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		pw.Notify(func(p progress.ProgressState) {
			send(conn, p)
			if err != nil {
				log.Println(err)
				return
			}
		})

	})

	server := &http.Server{Addr: ":4445"}

	go func() {
		if err := server.ListenAndServe(); err != nil {
			// handle err
		}
	}()

	// Setting up signal capturing
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	// Waiting for SIGINT (pkill -2)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Failed to stop server gracefully. Cause: %s", err)
	}
}

func send(conn *websocket.Conn, msg progress.ProgressState) {
	sMsg, _ := json.Marshal(msg)
	err := conn.WriteMessage(1, sMsg)
	if err != nil {
		log.Println(err)
	}
}
