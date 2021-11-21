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
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/eclipse-che/che-machine-exec/auth"
	"github.com/eclipse-che/che-machine-exec/common/rest"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/exec"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var (
	execManager = exec.GetExecManager()
)

func HandleInit(c *gin.Context) {
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

	execRequest := handleContainerResolve(c, token, initConfigParams.ContainerName)
	if execRequest == nil {
		rest.WriteResponse(c, http.StatusInternalServerError, "Could not retrieve exec request")
		return
	}

	err := HandleKubeConfigCreation(&kubeConfigParams, &execRequest.ContainerInfo)
	if err != nil {
		rest.WriteResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	marshal, err := json.Marshal(execRequest)
	if err != nil {
		rest.WriteResponse(c, http.StatusInternalServerError, fmt.Sprintf("Failed to marshal resolved exec. Cause: %s", err.Error()))
		return
	}

	_, err = c.Writer.Write(marshal)
	if err != nil {
		logrus.Error("Failed to write response", err)
	}
}

func handleContainerResolve(c *gin.Context, token, container string) *model.ResolvedExec {
	resolvedExec, err := execManager.Resolve(container, token)

	if err != nil {
		rest.WriteResponse(c, http.StatusInternalServerError, fmt.Sprintf("Unable to resolve exec. Cause: %s", err.Error()))
		return nil
	}

	return resolvedExec
}
