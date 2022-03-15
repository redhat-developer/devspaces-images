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

package activity

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eclipse-che/che-machine-exec/exec"
	"github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

var (
	DevWorkspaceAPIResource = &metav1.APIResource{
		Name:       "devworkspaces",
		Group:      "workspace.devfile.io",
		Version:    "v1alpha1",
		Namespaced: true,
	}

	DevWorkspaceGroupVersion = &schema.GroupVersion{
		Group:   "workspace.devfile.io",
		Version: "v1alpha1",
	}
)

type Manager interface {
	// Start starts tracking users activity and scheduling workspace stopping if there is no activity for idle timeout
	// Should be called once
	Start()

	// Tick registers users activity and postpones workspace stopping by inactivity
	Tick()
}

func New(idleTimeout, stopRetryPeriod time.Duration) (Manager, error) {
	if idleTimeout < 0 {
		return &noOpManager{}, nil
	}

	if stopRetryPeriod <= 0 {
		return nil, errors.New("stop retry period must be greater than 0")
	}

	namespace := exec.GetNamespace()
	if namespace == "" {
		return nil, errors.New("unable to evaluate the current namespace that is needed for activity manager works correctly")
	}

	workspaceName, isFound := os.LookupEnv("CHE_WORKSPACE_NAME")
	if !isFound {
		workspaceName, isFound = os.LookupEnv("DEVWORKSPACE_NAME")
		if !isFound {
			return nil, errors.New("CHE_WORKSPACE_NAME or DEVWORKSPACE_NAME environment variables must be set for activity manager to work correctly")
		}
	}

	return managerImpl{
		namespace:       namespace,
		workspaceName:   workspaceName,
		idleTimeout:     idleTimeout,
		stopRetryPeriod: stopRetryPeriod,
		activityC:       make(chan bool),
	}, nil
}

// noOpManager should be used if idle timeout is configured less 0
// invocation its method does not have affect
type noOpManager struct{}

func (m noOpManager) Tick()  {}
func (m noOpManager) Start() {}

type managerImpl struct {
	namespace     string
	workspaceName string

	idleTimeout     time.Duration
	stopRetryPeriod time.Duration

	activityC chan bool
}

func (m managerImpl) Tick() {
	select {
	case m.activityC <- true:
	default:
		// activity is already registered and it will reset timer if workspace won't be stopped
		logrus.Debug("activity manager is temporary busy")
	}
}

func (m managerImpl) Start() {
	logrus.Infof("Activity tracker is run and workspace will be stopped in %s if there is no activity", m.idleTimeout)
	timer := time.NewTimer(m.idleTimeout)
	var shutdownChan = make(chan os.Signal, 1)
	signal.Notify(shutdownChan, syscall.SIGTERM)

	go func() {
		for {
			select {
			case <-timer.C:
				if err := m.stopWorkspace(); err != nil {
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

func (m managerImpl) stopWorkspace() error {
	c, err := newWorkspaceClientInCluster()
	if err != nil {
		return err
	}

	stopWorkspacePath := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"metadata": map[string]interface{}{
				"annotations": map[string]interface{}{
					"controller.devfile.io/stopped-by": "inactivity",
				},
			},
			"spec": map[string]interface{}{
				"started": false,
			},
		},
	}
	jsonPath, err := stopWorkspacePath.MarshalJSON()
	if err != nil {
		return err
	}

	_, err = c.Resource(DevWorkspaceGroupVersion.WithResource("devworkspaces")).Namespace(m.namespace).Patch(context.TODO(), m.workspaceName, types.MergePatchType, jsonPath, v1.PatchOptions{}, "")
	if err != nil {
		return err
	}

	return nil
}

func newWorkspaceClientInCluster() (dynamic.Interface, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}
	config.APIPath = "/apis"
	config.GroupVersion = DevWorkspaceGroupVersion

	c, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	return c, nil
}
