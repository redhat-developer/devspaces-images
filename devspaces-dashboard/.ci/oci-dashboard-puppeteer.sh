#!/bin/bash
#
# Copyright (c) 2019-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Catch the finish of the job and write logs in artifacts.

# exit immediately when a command fails
set -e
# only exit with zero if all commands of the pipeline exit successfully
set -o pipefail
# error on unset variables
set -u
# uncomment to print each command before executing it
set -x

export CI_CHE_DASHBOARD_IMAGE=${CI_CHE_DASHBOARD_IMAGE:-quay.io/eclipse/che-dashboard:next}
export CHE_REPO_BRANCH="main"
export CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"
export DEVWORKSPACE_SMOKE_TEST="https://raw.githubusercontent.com/eclipse/che/${CHE_REPO_BRANCH}/tests/devworkspace-happy-path"
export ECLIPSE_CHE_URL="${ECLIPSE_CHE_URL:-localhost}"
export KUBE_ADMIN_PASSWORD="${ECLIPSE_CHE_URL:-admin}"

source <(curl -s ${DEVWORKSPACE_SMOKE_TEST}/common.sh)

#trap 'collectLogs $?' EXIT SIGINT

setupCheDashboard() {
  # Deploy Eclipse Che with a custom dashboard image
  cat >/tmp/che-cr-patch.yaml <<EOF
apiVersion: org.eclipse.che/v2
spec:
  components:
    dashboard:
      deployment:
        containers:
          - image: '${CI_CHE_DASHBOARD_IMAGE}'
            imagePullPolicy: Always
EOF
  chectl server:deploy \
    --platform openshift \
    --che-operator-cr-patch-yaml /tmp/che-cr-patch.yaml \
    --batch \
    --telemetry=off
}

setUpTestPod() {
  echo '------------------------------------------'
  oc delete project puppeteer --ignore-not-found
  oc new-project puppeteer --description="puppeteer" --display-name="puppeteer" || true
  KUBE_ADMIN_PASSWORD="$(cat $KUBEADMIN_PASSWORD_FILE)"

  echo '---------------------env.CHE_NAMESPACE---------------------'
  echo $CHE_NAMESPACE

  ECLIPSE_CHE_URL=http://$(oc get route -n "${CHE_NAMESPACE}" che -o jsonpath='{.status.ingress[0].host}')

  echo '---------------------env.ECLIPSE_CHE_URL---------------------'
  echo $ECLIPSE_CHE_URL

  echo '--------------- ENV-LIST -------------------'
  env
  echo '--------------- ENV-LIST-end -------------------'

  yq -iy '(.spec.containers[].env[]? | select(.name=="BASE_URL")).value = env.ECLIPSE_CHE_URL' .ci/resources/dashboard-pod.yaml
  yq -iy '(.spec.containers[].env[]? | select(.value=="crw4ever!")).value = env.KUBE_ADMIN_PASSWORD' .ci/resources/dashboard-pod.yaml

  echo '---------------pupetter-test-pod---------------:'
  cat .ci/resources/dashboard-pod.yaml
  echo '---------------end-of-pupetter-test-pod---------------'
  oc apply -f .ci/resources/dashboard-pod.yaml
}

setupCheDashboard
setUpTestPod
