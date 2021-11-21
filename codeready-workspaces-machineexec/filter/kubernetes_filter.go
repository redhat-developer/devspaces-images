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

package filter

import (
	"context"
	"errors"
	"fmt"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/cfg"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
)

const (
	MachineNameEnvVar = "CHE_MACHINE_NAME"
)

// Kubernetes specific implementation of the container information filter.
// Eclipse CHE workspace pod could be located in the same
// namespace like Eclipse CHE master or in the separated namespace.
// Kubernetes container filter search workspace pod by workspaceId and
// then search container information inside pod by machine name.
type KubernetesContainerFilter struct {
	ContainerFilter

	podGetterApi corev1.PodsGetter
	namespace    string
}

// Create new kubernetes container filter.
func NewKubernetesContainerFilter(namespace string, podGetterApi corev1.PodsGetter) *KubernetesContainerFilter {
	return &KubernetesContainerFilter{
		namespace:    namespace,
		podGetterApi: podGetterApi,
	}
}

func (filter *KubernetesContainerFilter) GetContainerList() (containersInfo []*model.ContainerInfo, err error) {
	pods, err := filter.getWorkspacePods()
	if err != nil {
		return nil, err
	}

	for _, pod := range pods.Items {
		for _, container := range pod.Spec.Containers {
			containersInfo = append(containersInfo, &model.ContainerInfo{ContainerName: container.Name, PodName: pod.Name})
		}
	}

	return containersInfo, nil
}

func (filter *KubernetesContainerFilter) GetContainer(name string) (containerInfo *model.ContainerInfo, err error) {
	pods, err := filter.getWorkspacePods()
	if err != nil {
		return nil, err
	}

	for _, pod := range pods.Items {
		for _, container := range pod.Spec.Containers {
			if container.Name == name {
				return &model.ContainerInfo{ContainerName: container.Name, PodName: pod.Name}, nil
			}
		}
	}

	return nil, errors.New(fmt.Sprintf("Workspace-related pod does not have container with name %s", name))
}

// Find container information by pod label: "wsId" and container environment variables "machineName".
func (filter *KubernetesContainerFilter) FindContainerInfo(identifier *model.MachineIdentifier) (containerInfo *model.ContainerInfo, err error) {
	wsPods, err := filter.getWorkspacePods()
	if err != nil {
		return nil, err
	}

	for _, pod := range wsPods.Items {
		containerName := findContainerName(pod, identifier.MachineName)
		if containerName != "" {
			return &model.ContainerInfo{ContainerName: containerName, PodName: pod.Name}, nil
		}
	}

	return nil, errors.New("container with name " + identifier.MachineName + " was not found.")
}

func (filter *KubernetesContainerFilter) getWorkspacePods() (*v1.PodList, error) {
	filterOptions := metav1.ListOptions{LabelSelector: cfg.PodSelector, FieldSelector: "status.phase=Running"}
	wsPods, err := filter.podGetterApi.Pods(filter.namespace).List(context.TODO(), filterOptions)
	if err != nil {
		return nil, err
	}

	if len(wsPods.Items) == 0 {
		return nil, errors.New("pods could not be found with selector: " + cfg.PodSelector)
	}

	return wsPods, nil
}

func findContainerName(pod v1.Pod, machineName string) string {
	for _, container := range pod.Spec.Containers {
		for _, env := range container.Env {
			if env.Name == MachineNameEnvVar && env.Value == machineName {
				return container.Name
			}
		}
		// ^ Che specific logic failed, try devworkspace one
		if container.Name == machineName {
			return container.Name
		}
	}
	return ""
}
