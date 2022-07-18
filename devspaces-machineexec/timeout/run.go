//
// Copyright (c) 2022 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package timeout

import (
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eclipse-che/che-machine-exec/exec"
	"github.com/sirupsen/logrus"
)

type RunIdleManager interface {
	// Start schedules workspace to stop after run timeout
	// Should be called once
	Start()
}

func NewRunIdleManager(runTimeout, stopRetryPeriod time.Duration) (RunIdleManager, error) {
	if runTimeout <= 0 {
		return &noOpRunIdleManager{}, nil
	}

	if stopRetryPeriod <= 0 {
		return nil, errors.New("stop retry period must be greater than 0")
	}

	namespace := exec.GetNamespace()
	if namespace == "" {
		return nil, errors.New("unable to evaluate the current namespace required for run idle manager to work correctly")
	}

	workspaceName, isFound := os.LookupEnv("CHE_WORKSPACE_NAME")
	if !isFound {
		workspaceName, isFound = os.LookupEnv("DEVWORKSPACE_NAME")
		if !isFound {
			return nil, errors.New("CHE_WORKSPACE_NAME or DEVWORKSPACE_NAME environment variables must be set for activity manager to work correctly")
		}
	}

	return runIdleManagerImpl{
		namespace:       namespace,
		workspaceName:   workspaceName,
		runTimeout:      runTimeout,
		stopRetryPeriod: stopRetryPeriod,
	}, nil
}

// noOpRunIdleManager should be used if run timeout is configured less 0
// invocation its method does not have affect
type noOpRunIdleManager struct{}

func (m noOpRunIdleManager) Start() {}

type runIdleManagerImpl struct {
	namespace     string
	workspaceName string

	runTimeout      time.Duration
	stopRetryPeriod time.Duration
}

func (m runIdleManagerImpl) Start() {
	logrus.Infof("Run idle manager is running. The workspace will be stopped in %s", m.runTimeout)
	timer := time.NewTimer(m.runTimeout)
	var shutdownChan = make(chan os.Signal, 1)
	signal.Notify(shutdownChan, syscall.SIGTERM)

	go func() {
		for {
			select {
			case <-timer.C:
				if err := stopWorkspace(m.namespace, m.workspaceName); err != nil {
					timer.Reset(m.stopRetryPeriod)
					logrus.Errorf("Failed to stop workspace. Will retry in %s. Cause: %s", m.stopRetryPeriod, err)
				} else {
					logrus.Info("Workspace has reached its run timeout. Bye")
					return
				}
			case <-shutdownChan:
				logrus.Info("Received SIGTERM: shutting down run timeout manager")
				return
			}
		}
	}()
}
