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

package model

import "time"

type BrokerStatus string

// Broker statuses
const (
	StatusIdle BrokerStatus = "IDLE"

	StatusStarted BrokerStatus = "STARTED"

	StatusDone BrokerStatus = "DONE"

	StatusFailed BrokerStatus = "FAILED"

	BrokerStatusEventType = "broker/statusChanged"

	BrokerResultEventType = "broker/result"

	BrokerLogEventType = "broker/log"
)

type StartedEvent struct {
	Status    BrokerStatus `json:"status" yaml:"status"`
	RuntimeID RuntimeID    `json:"runtimeId" yaml:"runtimeId"`
}

// Type returns BrokerStatusEventType.
func (e *StartedEvent) Type() string { return BrokerStatusEventType }

type ErrorEvent struct {
	Status    BrokerStatus `json:"status" yaml:"status"`
	RuntimeID RuntimeID    `json:"runtimeId" yaml:"runtimeId"`
	Error     string       `json:"error" yaml:"error"`
}

// Type returns BrokerStatusEventType.
func (e *ErrorEvent) Type() string { return BrokerStatusEventType }

// SuccessEvent is used to send encoded workspace tooling configuration to Che master
type SuccessEvent struct {
	Status    BrokerStatus `json:"status" yaml:"status"`
	RuntimeID RuntimeID    `json:"runtimeId" yaml:"runtimeId"`
	Tooling   string       `json:"tooling" yaml:"tooling"`
}

// Type returns BrokerResultEventType.
func (e *SuccessEvent) Type() string { return BrokerResultEventType }

type PluginBrokerLogEvent struct {
	RuntimeID RuntimeID `json:"runtimeId" yaml:"runtimeId"`

	// Time when this event occurred.
	Time time.Time `json:"time" yaml:"text"`

	// Text is written by plugin broker line of text.
	Text string `json:"text" yaml:"text"`
}

// Type returns BrokerLogEventType.
func (e *PluginBrokerLogEvent) Type() string { return BrokerLogEventType }
