//
// Copyright (c) 2012-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package auth

import (
	"errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	k8sRest "k8s.io/client-go/rest"
)

var (
	UserAPIResource = &metav1.APIResource{
		Group:      "user.openshift.io",
		Version:    "v1",
		Name:       "users",
		Namespaced: false,
	}

	UserGroupVersion = &schema.GroupVersion{
		Group:   "user.openshift.io",
		Version: "v1",
	}
)

func getCurrentUserID(token string) (string, error) {
	client, err := newDynamicForUsersWithToken(token)
	if err != nil {
		return "", err
	}

	userInfo, err := client.Resource(UserAPIResource, "").Get("~", metav1.GetOptions{})
	if err != nil {
		return "", errors.New("Failed to retrieve the current user info. Cause: " + err.Error())
	}

	return string(userInfo.GetUID()), nil
}

func newDynamicForUsersWithToken(token string) (dynamic.Interface, error) {
	config, err := k8sRest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	config.BearerToken = token
	config.GroupVersion = UserGroupVersion
	config.APIPath = "apis"

	client, err := dynamic.NewClient(config)
	if err != nil {
		return nil, err
	}
	return client, nil
}
