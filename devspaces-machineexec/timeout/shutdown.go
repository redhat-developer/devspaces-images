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
	"context"

	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

var (
	DevWorkspaceGroupVersion = &schema.GroupVersion{
		Group:   "workspace.devfile.io",
		Version: "v1alpha1",
	}
)

func stopWorkspace(namespace string, workspaceName string) error {
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

	_, err = c.Resource(DevWorkspaceGroupVersion.WithResource("devworkspaces")).Namespace(namespace).Patch(context.TODO(), workspaceName, types.MergePatchType, jsonPath, v1.PatchOptions{}, "")
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
