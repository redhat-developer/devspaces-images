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

package exec

import (
	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse/che-go-jsonrpc/event"
)

// Exec health watcher. This watcher cleans up exec resources
// and sends notification to the subscribed clients in case exec error or exit.
type HealthWatcher struct {
	manager  ExecManager
	exec     *model.MachineExec
	eventBus *event.Bus
}

// Create new exec health watcher
func NewHealthWatcher(exec *model.MachineExec, eventBus *event.Bus, manager ExecManager) *HealthWatcher {
	return &HealthWatcher{
		exec:     exec,
		manager:  manager,
		eventBus: eventBus}
}

// Look at the exec health and clean up application on exec exit/error,
// sent exit/error event to the subscribed clients
func (watcher *HealthWatcher) CleanUpOnExitOrError() {
	go func() {
		select {
		case <-watcher.exec.ExitChan:
			watcher.manager.Remove(watcher.exec.ID)
			execExitEvent := &model.ExecExitEvent{ExecId: watcher.exec.ID}
			watcher.eventBus.Pub(execExitEvent)

		case err := <-watcher.exec.ErrorChan:
			watcher.manager.Remove(watcher.exec.ID)
			execErrorEvent := &model.ExecErrorEvent{ExecId: watcher.exec.ID, Stack: err.Error()}
			watcher.eventBus.Pub(execErrorEvent)
		}
	}()
}
