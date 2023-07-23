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
set -o pipefail
set -u
set -x

START=$(date +%s.%N)
SCRIPT_DIR=$(dirname $(readlink -f "$0"))

export WORKDIR=${WORKDIR:-"${SCRIPT_DIR}/workdir"}
export CHE_NAMESPACE=${CHE_NAMESPACE:-"eclipse-che"}
export SMOKE_TEST_POD_NAME='smoke-test-che'
export SMOKE_TEST_POD_FILE="${SCRIPT_DIR}/resources/pod-che-smoke-test.yaml"
export ARTIFACT_DIR=${ARTIFACT_DIR:-"/tmp/devworkspace-smoke-test-artifacts"}

rm -rf ${WORKDIR}
mkdir -p ${WORKDIR}

# method originally extracted from eclipse/che/tests/devworkspace-happy-path/common.sh
function bumpPodsInfo() {
    NS=$1
    TARGET_DIR="${ARTIFACT_DIR}/${NS}-info"
    mkdir -p "$TARGET_DIR"
    for POD in $(oc get pods -o name -n ${NS}); do
        for CONTAINER in $(oc get -n ${NS} ${POD} -o jsonpath="{.spec.containers[*].name}"); do
            echo "[INFO] Downloading logs $POD/$CONTAINER in $NS"
            # container name includes `pod/` prefix. remove it
            LOGS_FILE=$TARGET_DIR/$(echo ${POD}-${CONTAINER}.log | sed 's|pod/||g')
            oc logs ${POD} -c ${CONTAINER} -n ${NS} > $LOGS_FILE || true
        done
    done
    echo "[INFO] Bumping events in namespace ${NS}"
    oc get events -n $NS -o=yaml > $TARGET_DIR/events.log || true
}

# method originally extracted from eclipse/che/tests/devworkspace-happy-path/common.sh
# Collect logs from Che and DevWorkspace Operator
# which is supposed to be executed after test finishes
function collectLogs() {
  bumpPodsInfo "devworkspace-controller"
  bumpPodsInfo "eclipse-che"
  USERS_CHE_NS="che-user-che"
  bumpPodsInfo $USERS_CHE_NS
  # Fetch DW related CRs but do not fail when CRDs are not installed yet
  oc get devworkspace -n $USERS_CHE_NS -o=yaml > ${ARTIFACT_DIR}/devworkspaces.yaml || true
  oc get devworkspacetemplate -n $USERS_CHE_NS -o=yaml > ${ARTIFACT_DIR}/devworkspace-templates.yaml || true
  oc get devworkspacerouting -n $USERS_CHE_NS -o=yaml > ${ARTIFACT_DIR}/devworkspace-routings.yaml || true

  # grab logs with chectl but don't fail if it's not available
  chectl server:logs --directory=${ARTIFACT_DIR}/chectl-server-logs --telemetry=off || true

  echo "[INFO] Logs are collected and can be found in $ARTIFACT_DIR"
}

# method originally extracted from eclipse/che/tests/devworkspace-happy-path/launch.sh
# Create cluster-admin user inside of OpenShift cluster and login
function provisionOpenShiftOAuthUser() {
  echo "[INFO] Testing if Che User exists."
  KUBECONFIG="${KUBECONFIG:-${HOME}/.kube/config}"
  TMP_KUBECONFIG="$WORKDIR/kubeconfig"
  cp "$KUBECONFIG" "$TMP_KUBECONFIG"

  if oc login -u che-user -p user --kubeconfig $TMP_KUBECONFIG; then
    echo "[INFO] Che User already exists. Using it"
    return 0
  fi
  echo "[INFO] Che User does not exist. Setting up htpasswd oauth for it."
  oc delete secret dev-htpasswd-secret -n openshift-config || true
  oc create secret generic dev-htpasswd-secret --from-file=htpasswd="$SCRIPT_DIR/resources/users.htpasswd" -n openshift-config

  if [[ $(oc get oauth/cluster -o=json | jq -e 'select (.spec.identityProviders == null)') ]]; then
    # there are no identity providers. We can do merge and set the whole .spec.identityProviders field
    echo "[INFO] No identity providers found, provisioning Che one."
    oc patch oauth/cluster --type=merge -p "$(cat $SCRIPT_DIR/resources/cluster-oauth-patch.json)"
  elif [[ ! $(oc get oauth/cluster -o=json | jq -e '.spec.identityProviders[]?.name? | select ( . == ("dev-htpasswd"))') ]]; then
    # there are some identity providers. We should do add patch not to override existing identity providers
    echo "[INFO] OAuth Cluster is found but dev-htpasswd provider missing. Provisioning it."
    oc patch oauth/cluster --type=json -p '[{
      "op": "add",
      "path": "/spec/identityProviders/0",
      "value": {
        "name":"dev-htpasswd",
        "mappingMethod":"add",
        "type":"HTPasswd",
        "htpasswd": {
          "fileData":{"name":"dev-htpasswd-secret"}
        }
      }
    }]'
  else
    echo "[INFO] dev-htpasswd oauth provider is found. Using it"
  fi

  echo "[INFO] rollout oauth-openshift pods for applying OAuth configuration"
  # apply just added identity providers, we need to rollout deployment for make sure
  # that new IDP item will appear in the IDP table
  # https://github.com/eclipse/che/issues/20822

  oc rollout status -n openshift-authentication deployment/oauth-openshift
  echo -e "[INFO] Waiting for htpasswd auth to be working up to 5 minutes"
  CURRENT_TIME=$(date +%s)
  ENDTIME=$(($CURRENT_TIME + 300))
  while [ $(date +%s) -lt $ENDTIME ]; do
      if oc login -u happypath-dev -p dev --kubeconfig $TMP_KUBECONFIG; then
          return 0
      fi
      sleep 10
  done
  echo "[ERROR] Che htpasswd changes are not affected after timeout."
  exit 1
}

# method originally extracted from eclipse/che/tests/devworkspace-happy-path/launch.sh
startSmokeTest() {
  oc delete pod "${SMOKE_TEST_POD_NAME}" -n eclipse-che --grace-period=30 --ignore-not-found
  # patch smoke-test-che.yaml
  ECLIPSE_CHE_URL=http://$(oc get route -n "${CHE_NAMESPACE}" che -o jsonpath='{.status.ingress[0].host}')
  cp $SMOKE_TEST_POD_FILE ${WORKDIR}/e2e-pod.yaml
  sed -i "s@CHE_URL@${ECLIPSE_CHE_URL}@g" ${WORKDIR}/e2e-pod.yaml
  sed -i "s@CHE-NAMESPACE@${CHE_NAMESPACE}@g" ${WORKDIR}/e2e-pod.yaml
  echo "[INFO] Applying the following patched Che Smoke Test Pod:"
  cat ${WORKDIR}/e2e-pod.yaml
  echo "[INFO] --------------------------------------------------"
  oc apply -f ${WORKDIR}/e2e-pod.yaml
  # wait for the pod to start
  n=0
  while [ $n -le 120 ]
  do
    PHASE=$(oc get pod -n ${CHE_NAMESPACE} ${SMOKE_TEST_POD_NAME} \
        --template='{{ .status.phase }}')
    if [[ ${PHASE} == "Running" ]]; then
      echo "[INFO] Smoke test started successfully."
      return
    fi

    sleep 5
    n=$(( n+1 ))
  done

  echo "[ERROR] Failed to start smoke test."
  exit 1
}

##########################
# LOGGING AND EXECUTIOIN #
##########################

# Catch the finish of the job and write logs in artifacts.
trap 'collectLogs $?' EXIT SIGINT

# Deploy Eclipse Che with a custom dashboard image
mkdir ${ARTIFACT_DIR}/e2e
cat > /tmp/che-cr-patch.yaml <<EOF
apiVersion: org.eclipse.che/v2
spec:
  components:
    dashboard:
      deployment:
        containers:
          - image: '${CI_CHE_DASHBOARD_IMAGE}'
            imagePullPolicy: Always
EOF
cp /tmp/che-cr-patch.yaml ${ARTIFACT_DIR}/e2e/
chectl server:deploy \
  --platform openshift \
  --che-operator-cr-patch-yaml /tmp/che-cr-patch.yaml \
  --batch \
  --telemetry=off

# Configure user auth
provisionOpenShiftOAuthUser

# Run Smoke test
startSmokeTest

echo "[INFO] Waiting until smoke test pod finished"
oc logs -n ${CHE_NAMESPACE} ${SMOKE_TEST_POD_NAME} -c smoke-test -f
# just to sleep
sleep 3

# Download artifacts
echo "[INFO] Downloading test report."
oc rsync -n ${CHE_NAMESPACE} ${SMOKE_TEST_POD_NAME}:/tmp/e2e/report/ ${ARTIFACT_DIR}/e2e -c download-reports
oc exec -n ${CHE_NAMESPACE} ${SMOKE_TEST_POD_NAME} -c download-reports -- touch /tmp/done
EXIT_CODE=$(oc logs -n ${CHE_NAMESPACE} ${SMOKE_TEST_POD_NAME} -c smoke-test | grep EXIT_CODE)
if [[ ${EXIT_CODE} != "+ EXIT_CODE=0" ]]; then
    echo "[ERROR] Smoke test failed. Check report at ${ARTIFACT_DIR}. Or smoke test pod in eclipse-che namespace"
    exit 1
fi
echo "[INFO] Smoke test succeed."

# End test
END=$(date +%s.%N)
echo "[INFO] Smoke test execution took $(echo "$END - $START" | bc) seconds."
