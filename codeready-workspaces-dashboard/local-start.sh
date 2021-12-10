#!/bin/bash

set -e
set -u

usage () {
cat << EOF
This scripts helps to build and run locally dashboard backend
with frontend included against remote Che Cluster.

Prerequisite for usage is having a kubernetes cluster in KUBECONFIG
and have access to Che namespace (use $CHE_NAMESPACE env var to configure it).

Arguments:
  -f|--force-build : by default packages are compiled only when they were not previously.
                      This option should be used if compiled files must be overridden with fresher version.
Env vars:
  KUBECONFIG    : Kubeconfig file location. Default: "$HOME/.kube/config"
  CHE_NAMESPACE : kubernetes namespace where Che Cluster should be looked into. Default: "eclipse-che"
  CHE_CRD_OBJECT_NAME : kubernetes CRD object name. Default: "eclipse-che"
Examples:
$0
$0 --force-build
EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      '-f'|'--force-build') FORCE_BUILD="true"; shift 0;;
      '--help') usage; exit 0;;
      *) echo "[ERROR] Unknown parameter is used: $1."; usage; exit 1;;
    esac
    shift 1
  done
}

FORCE_BUILD="false"
# Init Che Namespace with the default value if it's not set
CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"

# Init Che CRD object name with the default value if it's not set
CHE_CRD_OBJECT_NAME="${CHE_CRD_OBJECT_NAME:-eclipse-che}"

# guide backend to use the current cluster from kubeconfig
export LOCAL_RUN="true"
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"

DASHBOARD_COMMON=packages/common
DASHBOARD_FRONTEND=packages/dashboard-frontend
DASHBOARD_BACKEND=packages/dashboard-backend

parse_args "$@"

if [ "$FORCE_BUILD" == "true" ] || \
    [ ! -d $DASHBOARD_COMMON/lib ] || [ -z "$(ls -A $DASHBOARD_COMMON/lib)" ]; then
  echo "[INFO] Compiling common package"
  yarn --cwd $DASHBOARD_COMMON build
fi

if [ "$FORCE_BUILD" == "true" ] || \
    [ ! -d $DASHBOARD_FRONTEND/lib ] || [ -z "$(ls -A $DASHBOARD_FRONTEND/lib)" ]; then
  echo "[INFO] Compiling frontend package"
  yarn --cwd $DASHBOARD_FRONTEND build:dev
fi

if [ "$FORCE_BUILD" == "true" ] || \
    [ ! -d $DASHBOARD_BACKEND/lib ] || [ -z "$(ls -A $DASHBOARD_BACKEND/lib)" ]; then
  echo "[INFO] Compiling backend package"
  yarn --cwd $DASHBOARD_BACKEND build:dev
fi

# do nothing
PRERUN_COMMAND="echo"
GATEWAY=$(kubectl get deployments.apps che-gateway -o=json --ignore-not-found -n $CHE_NAMESPACE)
if [[ ! -z "$GATEWAY" && \
    $(echo "$GATEWAY" | jq -e '.spec.template.spec.containers|any(.name == "oauth-proxy")') == "true" ]]; then
  echo "Detected gateway and oauth-proxy inside. Running in native auth mode."
  export NATIVE_AUTH="true"
  export CLUSTER_ACCESS_TOKEN=$(oc whoami -t)

  # when native auth we go though port forward to avoid dealing with OpenShift OAuth Cookies
  CHE_FORWARDED_PORT=8081
  export CHE_API_PROXY_UPSTREAM="http://localhost:${CHE_FORWARDED_PORT}"
  PRERUN_COMMAND="kubectl port-forward service/che-host ${CHE_FORWARDED_PORT}:8080 -n $CHE_NAMESPACE"
else
  echo "Gateway with oauth-proxy inside is not detected. Running in keycloak mode."
  # when keycloak, we proxy requests directly against remote cluster
  export CHE_API_PROXY_UPSTREAM=$(oc get checluster -n $CHE_NAMESPACE eclipse-che -o=json | jq -r '.status.cheURL')
fi

# consider renaming it to CHE_API_URL since it's not just host
export CHE_HOST=http://localhost:8080

# relative path from backend package
FRONTEND_RESOURCES=../../../../$DASHBOARD_FRONTEND/lib
$PRERUN_COMMAND & yarn --cwd $DASHBOARD_BACKEND start:debug --publicFolder $FRONTEND_RESOURCES
