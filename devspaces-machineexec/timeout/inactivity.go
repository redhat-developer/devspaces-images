//
// Copyright (c) 2019-2022 Red Hat, Inc.
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

type InactivityIdleManager interface {
	// Start starts tracking users activity and scheduling workspace stopping if there is no activity for idle timeout
	// Should be called once
	Start()

	// Tick registers users activity and postpones workspace stopping by inactivity
	Tick()
}

func NewInactivityIdleManager(idleTimeout, stopRetryPeriod time.Duration) (InactivityIdleManager, error) {
	if idleTimeout <= 0 {
		return &noOpInactivityIdleManager{}, nil
	}

	if stopRetryPeriod <= 0 {
		return nil, errors.New("stop retry period must be greater than 0")
	}

	namespace := exec.GetNamespace()
	if namespace == "" {
		return nil, errors.New("unable to evaluate the current namespace required for activity manager to work correctly")
	}

	workspaceName, isFound := os.LookupEnv("CHE_WORKSPACE_NAME")
	if !isFound {
		workspaceName, isFound = os.LookupEnv("DEVWORKSPACE_NAME")
		if !isFound {
			return nil, errors.New("CHE_WORKSPACE_NAME or DEVWORKSPACE_NAME environment variables must be set for activity manager to work correctly")
		}
	}

	return inactivityIdleManagerImpl{
		namespace:       namespace,
		workspaceName:   workspaceName,
		idleTimeout:     idleTimeout,
		stopRetryPeriod: stopRetryPeriod,
		activityC:       make(chan bool),
	}, nil
}

// noOpInactivityIdleManager should be used if idle timeout is configured less 0
// invocation its method does not have affect
type noOpInactivityIdleManager struct{}

func (m noOpInactivityIdleManager) Tick()  {}
func (m noOpInactivityIdleManager) Start() {}

type inactivityIdleManagerImpl struct {
	namespace     string
	workspaceName string

	idleTimeout     time.Duration
	stopRetryPeriod time.Duration

	activityC chan bool
}

func (m inactivityIdleManagerImpl) Tick() {
	select {
	case m.activityC <- true:
	default:
		// activity is already registered and it will reset timer if workspace won't be stopped
		logrus.Debug("activity manager is temporary busy")
	}
}

func (m inactivityIdleManagerImpl) Start() {
	logrus.Infof("Activity tracker is run and workspace will be stopped in %s if there is no activity", m.idleTimeout)
	timer := time.NewTimer(m.idleTimeout)
	var shutdownChan = make(chan os.Signal, 1)
	signal.Notify(shutdownChan, syscall.SIGTERM)

	go func() {
		for {
			select {
			case <-timer.C:
				if err := stopWorkspace(m.namespace, m.workspaceName, stoppedByInactivity); err != nil {
					timer.Reset(m.stopRetryPeriod)
					logrus.Errorf("Failed to stop workspace. Will retry in %s. Cause: %s", m.stopRetryPeriod, err)
				} else {
					logrus.Info("Workspace is successfully stopped by inactivity. Bye")
					return
				}
			case <-m.activityC:
				logrus.Debug("Activity is reported. Resetting timer")
				if !timer.Stop() {
					<-timer.C
				}
				timer.Reset(m.idleTimeout)
			case <-shutdownChan:
				logrus.Info("Received SIGTERM: shutting down activity manager")
				return
			}
		}
	}()
}
