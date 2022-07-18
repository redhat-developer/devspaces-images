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

package cfg

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
)

var (
	// URL che-machine-exec api server url
	URL string
	// StaticPath path to serve static resources
	StaticPath string
	// UseBearerToken - flag to enable/disable using bearer token to avoid users impersonation while accessing to k8s API.
	// if enabled - authenticated user ID must be configured
	UseBearerToken bool
	// AuthenticatedUserID is a user's ID who is authenticated to use API. Is ignored if useBearerToken is disabled
	AuthenticatedUserID string

	// IdleTimeout is a inactivity period after which workspace should be stopped
	// Default value is 30 minutes
	IdleTimeout time.Duration
	// StopRetryPeriod is a period after which workspace should be tried to stop if the previous try failed
	// Default value is 10 seconds
	StopRetryPeriod time.Duration
	// RunTimeout is the maximum duration a workspace can be running before it is stopped
	// Default value is -1, which means - no maximium duration
	RunTimeout time.Duration

	// UseTLS flag to enable/disable serving TLS
	UseTLS bool

	// PodSelector set of labels to be used as selector for getting workspace pod.
	// Default value is che.workspace_id=${CHE_WORKSPACE_ID}
	PodSelector string
)

func init() {
	defaultURLValue := ":4444"
	urlEnvValue, isFound := os.LookupEnv("API_URL")
	if isFound && len(urlEnvValue) > 0 {
		defaultURLValue = urlEnvValue
	}
	flag.StringVar(&URL, "url", defaultURLValue, "Host:Port address.")

	defaultStaticPath := ""
	staticPathEnvValue, isFound := os.LookupEnv("STATIC_RESOURCES_PATH")
	if isFound && len(staticPathEnvValue) > 0 {
		defaultStaticPath = staticPathEnvValue
	}
	flag.StringVar(&StaticPath, "static", defaultStaticPath, "/home/user/frontend - absolute path to folder with static resources.")

	defaultUseTokenValue := false
	useTokenEnv := "USE_BEARER_TOKEN"
	useTokenEnvValue, isFound := os.LookupEnv(useTokenEnv)
	if isFound && len(useTokenEnvValue) > 0 {
		if v, err := strconv.ParseBool(useTokenEnvValue); err == nil {
			defaultUseTokenValue = v
		} else {
			logrus.Errorf("Invalid value '%s' for env variable key '%s'. Value should be boolean", useTokenEnvValue, useTokenEnv)
		}
	}
	flag.BoolVar(&UseBearerToken, "use-bearer-token", defaultUseTokenValue, "to avoid users impersonation while accessing to k8s API. When enabled - authenticated user id must be configured")

	defaultAuthenticatedUserID := ""
	authenticatedUserID, isFound := os.LookupEnv("AUTHENTICATED_USER_ID")
	if isFound {
		defaultAuthenticatedUserID = authenticatedUserID
	}
	flag.StringVar(&AuthenticatedUserID, "authenticated-user-id", defaultAuthenticatedUserID, "OpenShift user's ID that should has access to API. Is used only if useBearerToken is configured")

	const defaultIdleTimeout = -1 * time.Nanosecond
	idleTimeout := defaultIdleTimeout
	idleTimeoutEnv := "SECONDS_OF_DW_INACTIVITY_BEFORE_IDLING"
	idleTimeoutEnvValue, isFound := os.LookupEnv(idleTimeoutEnv)
	if isFound && len(idleTimeoutEnvValue) > 0 {
		if v, err := strconv.ParseInt(idleTimeoutEnvValue, 10, 32); err == nil {
			idleTimeout = time.Duration(v) * time.Second
		} else {
			logrus.Errorf("Invalid value '%s' for env variable key '%s'. Value should be an integer", idleTimeoutEnvValue, idleTimeoutEnv)
		}
	}
	flag.DurationVar(&IdleTimeout, "idle-timeout", idleTimeout, "IdleTimeout is a inactivity period after which workspace should be stopped. By default, IdleTimeout is set to 30m. To disable IdleTimeout, set to -1. Examples: -1, 30s, 15m, 1h")

	const defaultRunTimeout = 1800 * time.Nanosecond
	runtimeout := defaultRunTimeout
	runTimeoutEnv := "SECONDS_OF_DW_RUN_BEFORE_IDLING"
	runTimeoutEnvValue, isFound := os.LookupEnv(runTimeoutEnv)
	if isFound && len(runTimeoutEnvValue) > 0 {
		if v, err := strconv.ParseInt(runTimeoutEnvValue, 10, 32); err == nil {
			runtimeout = time.Duration(v) * time.Second
		} else {
			logrus.Errorf("Invalid value '%s' for env variable key '%s'. Value should be an integer", runTimeoutEnvValue, runTimeoutEnv)
		}
	}
	flag.DurationVar(&RunTimeout, "run-timeout", runtimeout, "RunTimeout is the maximum duration a workspace can run. After this period, the workspace will be stopped. Examples: -1, 30s, 15m, 1h")

	flag.DurationVar(&StopRetryPeriod, "stop-retry-period", 10*time.Second, "StopRetryPeriod is a period after which workspace should be tried to stop if the previous try failed. Examples: 30s")

	flag.BoolVar(&UseTLS, "use-tls", false, "Serve content via TLS")

	defaultPodSelector, isFound := os.LookupEnv("POD_SELECTOR")
	if !isFound {
		workspaceID := os.Getenv("DEVWORKSPACE_ID")
		if workspaceID != "" {
			defaultPodSelector = fmt.Sprintf("controller.devfile.io/devworkspace_id=%s", workspaceID)
		} else {
			workspaceID = os.Getenv("CHE_WORKSPACE_ID")
			if workspaceID != "" {
				defaultPodSelector = fmt.Sprintf("che.workspace_id=%s", workspaceID)
			}
		}
	}
	flag.StringVar(&PodSelector, "pod-selector", defaultPodSelector, "Selector that is used to find workspace pod. Default value is `che.workspace_id=${CHE_WORKSPACE_ID}` or controller.devfile.io/devworkspace_id={DEVWORKSPACE_ID} if che env var is not defined")

	setLogLevel()
}

func setLogLevel() {
	logLevel, isFound := os.LookupEnv("LOG_LEVEL")
	if isFound && len(logLevel) > 0 {
		parsedLevel, err := logrus.ParseLevel(logLevel)
		if err == nil {
			logrus.SetLevel(parsedLevel)
			logrus.Infof("Configured '%s' log level is applied", logLevel)
		} else {
			logrus.Errorf("Failed to parse log level `%s`. Possible values: panic, fatal, error, warn, info, debug. Default 'info' is applied", logLevel)
			logrus.SetLevel(logrus.InfoLevel)
		}
	} else {
		logrus.Infof("Default 'info' log level is applied")
		logrus.SetLevel(logrus.InfoLevel)
	}
}

// Parse application arguments
func Parse() {
	flag.Parse()

	if PodSelector == "" {
		logrus.Fatal("pod selector is required. Configure custom pod selector or che workspace/devworkspace id env var to activate defaults")
	}

	if StopRetryPeriod <= 0 {
		logrus.Fatalf("stop-retry-period must be greater than 0")
	}
}

// Print configuration information
func Print() {
	logrus.Info("Exec containers configuration:")

	logrus.Infof("==> Debug level %s", logrus.GetLevel().String())
	logrus.Infof("==> Application url %s", URL)
	logrus.Infof("==> Absolute path to folder with static resources %s", StaticPath)
	logrus.Infof("==> Use bearer token: %t", UseBearerToken)
	logrus.Infof("==> Pod selector: %s", PodSelector)
	if UseBearerToken {
		logrus.Infof("==> Authenticated user ID: %s", AuthenticatedUserID)
	}
	if IdleTimeout > 0 {
		logrus.Infof("==> Idle timeout: %s", IdleTimeout)
	}
	if RunTimeout > 0 {
		logrus.Infof("==> Run timeout: %s", RunTimeout)
	}
	if IdleTimeout > 0 || RunTimeout > 0 {
		logrus.Infof("==> Stop retry period: %s", StopRetryPeriod)
	}
}
