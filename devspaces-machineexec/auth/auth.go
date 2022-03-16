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

package auth

import (
	"net/http"

	"github.com/eclipse-che/che-machine-exec/cfg"
	restUtil "github.com/eclipse-che/che-machine-exec/common/rest"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func IsEnabled() bool {
	return cfg.UseBearerToken
}

func Authenticate(c *gin.Context) (string, error) {
	token, err := extractToken(c)
	if err != nil {
		return "", err
	}

	userID, err := getCurrentUserID(token)
	if err != nil {
		logrus.Error("Failed to verify user. Cause: ", err.Error())
		return "", restUtil.NewError(http.StatusInternalServerError, "unable to verify user with provided token")
	}

	if userID != cfg.AuthenticatedUserID {
		return "", restUtil.NewError(http.StatusForbidden, "the current user is not authorized to use API")
	}

	return token, nil
}
