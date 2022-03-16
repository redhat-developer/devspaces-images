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
	"strings"

	restUtil "github.com/eclipse-che/che-machine-exec/common/rest"
	"github.com/gin-gonic/gin"
)

const (
	AccessTokenHeader          = "X-Access-Token"
	ForwardedAccessTokenHeader = "X-Forwarded-Access-Token"
)

func extractToken(c *gin.Context) (string, error) {
	token := c.Request.Header.Get(AccessTokenHeader)
	if token != "" {
		token = strings.TrimPrefix(token, "Bearer ")
		return token, nil
	}

	token = c.Request.Header.Get(ForwardedAccessTokenHeader)
	if token != "" {
		return token, nil
	}

	return "", restUtil.NewError(http.StatusUnauthorized, "authorization header is missing")
}
