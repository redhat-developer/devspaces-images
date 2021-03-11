/*
 * Copyright (c) 2012-2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

package proxy_test

import (
	"github.com/coreos/goproxy"
	"github.com/eclipse/che-jwtproxy/proxy"
	"github.com/stretchr/testify/assert"
	"net/http"
	"regexp"
	"testing"
)

var ctx = &goproxy.ProxyCtx{}

func TestIsCors(t *testing.T) {

	preflightFunc := proxy.IsCorsPreflight()

	req := optionsRequest("http://foo.bar:6666/ez")
	req.Header.Add("Access-Control-Request-Method", "GET")
	assert.True(t, preflightFunc(req, ctx))

	req2 := optionsRequest("http://foo.bar:6666/ez")
	req2.Header.Add("Access-Control-Request-Header", "Authorization")
	assert.True(t, preflightFunc(req2, ctx))

	req3 := getRequest("http://foo.bar:6666/ez")
	req3.Header.Add("Access-Control-Request-Method", "POST")
	assert.False(t, preflightFunc(req3, ctx))

	req4 := optionsRequest("http://foo.bar:6666/ez")
	assert.False(t, preflightFunc(req4, ctx))
}

func TestUrlMatching(t *testing.T) {
	var ExclusionTestRequests = []struct {
		req      *http.Request
		expected bool // expected result
	}{
		{getRequest("http://foo.bar:6666/ezz666"), false},
		{getRequest("http://foo.bar:6666/api/liveness"), true},
		{postRequest("http://foo.bar:6666/api/liveness/"), true},
		{getRequest("http://foo.bar:6666/api/other/method"), true},
		{optionsRequest("http://foo.bar:6666/mypath"), false},
	}
	regex1, _ := regexp.Compile("^(/api/liveness/?)$")
	regex2, _ := regexp.Compile("^(/api/other/.*)$")
	matcherFunc := proxy.UrlMatches(regex1, regex2)

	for _, tt := range ExclusionTestRequests {
		actual := matcherFunc(tt.req, ctx)
		assert.Equal(t, tt.expected, actual)
	}
}

func getRequest(url string) *http.Request {
	req, _ := http.NewRequest("GET", url, nil)
	return req
}

func postRequest(url string) *http.Request {
	req, _ := http.NewRequest("POST", url, nil)
	return req
}

func optionsRequest(url string) *http.Request {
	req, _ := http.NewRequest("OPTIONS", url, nil)
	return req
}
