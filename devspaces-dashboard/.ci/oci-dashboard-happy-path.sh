#!/bin/bash
#
# Copyright (c) 2019-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e
set -x

export CHE_REPO_BRANCH="main"
export DEVWORKSPACE_HAPPY_PATH="https://raw.githubusercontent.com/eclipse/che/${CHE_REPO_BRANCH}/tests/devworkspace-happy-path"
source <(curl -s ${DEVWORKSPACE_HAPPY_PATH}/common.sh)

# Catch the finish of the job and write logs in artifacts.
trap 'collectLogs $?' EXIT SIGINT

run() {
  # Deploy Eclipse Che with a custom dashboard image
  cat > /tmp/che-cr-patch.yaml <<EOF
spec:
  components:
    dashboard:
      deployment:
        containers:
          - image: ${CI_CHE_DASHBOARD_IMAGE}
EOF
  chectl server:deploy \
    --platform openshift \
    --che-operator-cr-patch-yaml /tmp/che-cr-patch.yaml \
    --batch \
    --telemetry=off

  # Run Happy Path tests
  bash <(curl -s ${DEVWORKSPACE_HAPPY_PATH}/remote-launch.sh)
}

run
