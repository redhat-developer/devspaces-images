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

package common

import (
	"bytes"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/eclipse/che-plugin-broker/cfg"
	"github.com/eclipse/che-plugin-broker/model"
)

func (broker *brokerImpl) PubStarted() {
	broker.bus.Pub(&model.StartedEvent{
		Status:    model.StatusStarted,
		RuntimeID: cfg.RuntimeID,
	})
}

func (broker *brokerImpl) PubFailed(err string) {
	broker.bus.Pub(&model.ErrorEvent{
		Status:    model.StatusFailed,
		Error:     err,
		RuntimeID: cfg.RuntimeID,
	})
}

func (broker *brokerImpl) PubDone(tooling string) {
	broker.bus.Pub(&model.SuccessEvent{
		Status:    model.StatusDone,
		RuntimeID: cfg.RuntimeID,
		Tooling:   tooling,
	})
}

func (broker *brokerImpl) PubLog(text string) {
	broker.bus.Pub(&model.PluginBrokerLogEvent{
		RuntimeID: cfg.RuntimeID,
		Text:      text,
		Time:      time.Now(),
	})
}

func (broker *brokerImpl) PrintPlan(metas []model.PluginMeta) {
	var buffer bytes.Buffer

	buffer.WriteString("List of plugins and editors to install\n")
	for _, plugin := range metas {
		buffer.WriteString(fmt.Sprintf("- %s/%s/%s - %s\n", plugin.Publisher, plugin.Name, plugin.Version, plugin.Description))
	}

	broker.PrintInfo(buffer.String())
}

func (broker *brokerImpl) PrintDebug(format string, v ...interface{}) {
	if !cfg.PrintEventsOnly {
		log.Printf(format, v...)
	}
}

func (broker *brokerImpl) PrintInfo(format string, v ...interface{}) {
	message := fmt.Sprintf(format, v...)
	broker.PubLog(message)
	log.Print(message)
}

func (broker *brokerImpl) PrintInfoBuffer(buffer []string) {
	message := strings.Join(buffer, "\n")
	broker.PubLog(message)
	for _, line := range buffer {
		log.Print(line)
	}
}

func (broker *brokerImpl) PrintFatal(format string, v ...interface{}) {
	message := fmt.Sprintf(format, v...)
	broker.PubLog(message)
	log.Fatal(message)
}
