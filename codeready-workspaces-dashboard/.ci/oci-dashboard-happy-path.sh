#!/bin/bash
#
# Copyright (c) 2012-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

#!/usr/bin/env bash
# exit immediately when a command fails
set -e
# only exit with zero if all commands of the pipeline exit successfully
set -o pipefail
# error on unset variables
set -u
# print each command before executing it
set -x

export CHE_REPO_BRANCH="main"
source <(curl -s https://raw.githubusercontent.com/eclipse/che/${CHE_REPO_BRANCH}/tests/devworkspace-happy-path/common.sh)

# Catch the finish of the job and write logs in artifacts.
trap 'collectLogs $?' EXIT SIGINT

# ENV used by PROW ci
export CI="openshift"
export NAMESPACE="eclipse-che"

# Pod created by openshift ci don't have user. Using this envs should avoid errors with git user.
export GIT_COMMITTER_NAME="CI BOT"
export GIT_COMMITTER_EMAIL="ci_bot@notused.com"

deployChe() {
  cat > /tmp/che-cr-patch.yaml <<EOL
spec:
  devWorkspace:
    enable: true
  server:
    dashboardImage: ${CI_CHE_DASHBOARD_IMAGE}
    dashboardImagePullPolicy: Always
EOL

  echo "INFO: Using the following Che Cluster CR"
  cat /tmp/che-cr-patch.yaml
  echo "----------------------------------"
  # chectl is preinstalled in OpenShift CI image. See ./openshift-ci/Dockerfile
  chectl server:deploy --che-operator-cr-patch-yaml=/tmp/che-cr-patch.yaml -p openshift --batch --telemetry=off --installer=operator
}

deployChe
bash <(curl -s https://raw.githubusercontent.com/eclipse/che/${CHE_REPO_BRANCH}/tests/devworkspace-happy-path/remote-launch.sh)
