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

package rest

import (
	"net/http"

	"github.com/eclipse-che/che-machine-exec/auth"
	"github.com/eclipse-che/che-machine-exec/common/rest"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func HandleKubeConfig(c *gin.Context) {
	var token string
	if auth.IsEnabled() {
		var err error
		token, err = auth.Authenticate(c)
		if err != nil {
			rest.WriteErrorResponse(c, err)
			return
		}
	}

	var initConfigParams model.InitConfigParams
	if c.BindJSON(&initConfigParams) != nil {
		rest.WriteResponse(c, http.StatusInternalServerError, "Failed to convert body args into internal structure")
		return
	}

	kubeConfigParams := initConfigParams.KubeConfigParams
	kubeConfigParams.BearerToken = token

	if initConfigParams.ContainerName == "" {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, err := c.Writer.Write([]byte("Container name is required"))
		if err != nil {
			logrus.Error("Failed to write error response", err)
		}
		return
	}

	execRequest := handleContainerResolve(c, token, initConfigParams.ContainerName)
	if execRequest == nil {
		rest.WriteResponse(c, http.StatusInternalServerError, "Could not retrieve exec request")
		return
	}

	err := HandleKubeConfigCreation(&kubeConfigParams, &execRequest.ContainerInfo)

	if err != nil {
		logrus.Errorf("Unable to create kubeconfig. Cause: %s", err.Error())
		rest.WriteResponse(c, http.StatusInternalServerError, err.Error())
	}
}
