#!/bin/bash

set -e
set -u

usage() {
  cat <<EOF
This scripts helps to build and run locally dashboard backend
with frontend included against remote Che Cluster.

Prerequisite for usage is having a kubernetes cluster in KUBECONFIG
and have access to Che namespace (use $CHE_NAMESPACE env var to configure it).

Arguments:
  -f|--force-build : by default packages are compiled only when they were not previously.
                      This option should be used if compiled files must be overridden with fresher version.
  -c|--che-in-che : This option allows to use checluster internal URLs for developing.
Env vars:
  KUBECONFIG    : Kubeconfig file location. Default: "$HOME/.kube/config"
  CHE_NAMESPACE : kubernetes namespace where Che Cluster should be looked into. Default: "eclipse-che"
  CHECLUSTER_CR_NAME : kubernetes CRD object name. Default: "eclipse-che"
Examples:
$0
$0 --force-build
$0 --che-in-che
EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
    '-f' | '--force-build')
      FORCE_BUILD="true"
      shift 0
      ;;
    '-c' | '--che-in-che')
      CHE_IN_CHE="true"
      shift 0
      ;;
    '--help')
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown parameter is used: $1."
      usage
      exit 1
      ;;
    esac
    shift 1
  done
}

FORCE_BUILD="false"
CHE_IN_CHE="false"
# Init Che Namespace with the default value if it's not set
CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"

# guide backend to use the current cluster from kubeconfig
export LOCAL_RUN="true"
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
export CHE_SELF_SIGNED_MOUNT_PATH="${CHE_SELF_SIGNED_MOUNT_PATH:-$PWD/run/public-certs}"

DASHBOARD_COMMON=packages/common
DASHBOARD_FRONTEND=packages/dashboard-frontend
DASHBOARD_BACKEND=packages/dashboard-backend
DEVFILE_REGISTRY=packages/devfile-registry

parse_args "$@"

if [ "$FORCE_BUILD" == "true" ] ||
  [ ! -d $DASHBOARD_COMMON/lib ] || [ -z "$(ls -A $DASHBOARD_COMMON/lib)" ]; then
  echo "[INFO] Compiling common package"
  yarn --cwd $DASHBOARD_COMMON build
fi

if [ "$FORCE_BUILD" == "true" ] ||
  [ ! -d $DASHBOARD_FRONTEND/lib ] || [ -z "$(ls -A $DASHBOARD_FRONTEND/lib)" ]; then
  echo "[INFO] Compiling frontend package"
  yarn --cwd $DASHBOARD_FRONTEND build:dev
fi

if [ "$FORCE_BUILD" == "true" ] ||
  [ ! -d $DASHBOARD_BACKEND/lib ] || [ -z "$(ls -A $DASHBOARD_BACKEND/lib)" ]; then
  echo "[INFO] Compiling backend package"
  yarn --cwd $DASHBOARD_BACKEND build:dev
fi

if [ ! -d $DASHBOARD_FRONTEND/lib/public/dashboard/devfile-registry ]; then
  echo "[INFO] Copy devfile registry"
  cp -r $DEVFILE_REGISTRY $DASHBOARD_FRONTEND/lib/public/dashboard/devfile-registry
fi

export CLUSTER_ACCESS_TOKEN=$(oc whoami -t)
if [[ -z "$CLUSTER_ACCESS_TOKEN" ]]; then
  echo 'Cluster access token not found.'
  export DEX_INGRESS=$(kubectl get ingress dex -n dex -o jsonpath='{.spec.rules[0].host}')
  if [[ -n "$DEX_INGRESS" ]]; then
    echo 'Evaluated Dex ingress'

    echo 'Looking for staticClientID and  staticClientSecret...'
    export CLIENT_ID=$(kubectl get -n dex configMaps/dex -o jsonpath="{.data['config\.yaml']}" | yq e ".staticClients[0].id" -)
    export CLIENT_SECRET=$(kubectl get -n dex configMaps/dex -o jsonpath="{.data['config\.yaml']}" | yq e ".staticClients[0].secret" -)
    echo 'Done.'
  fi
fi

DASHBOARD_POD_NAME=$(kubectl get pods -n "$CHE_NAMESPACE" -o=custom-columns=:metadata.name | grep dashboard)

if [ "$CHE_IN_CHE" == "true" ]; then
  export SERVICE_ACCOUNT_TOKEN=$(cat /run/secrets/kubernetes.io/serviceaccount/token)
else
  export SERVICE_ACCOUNT_TOKEN=$(kubectl exec "$DASHBOARD_POD_NAME" -n "$CHE_NAMESPACE" -- cat /run/secrets/kubernetes.io/serviceaccount/token)
fi

export CHECLUSTER_CR_NAMESPACE=$(grep -o 'CHECLUSTER_CR_NAMESPACE:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHECLUSTER_CR_NAME=$(grep -o 'CHECLUSTER_CR_NAME:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTEDITOR=$(grep -o 'CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTEDITOR:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS=$(grep -o 'CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS:.*' run/.che-dashboard-pod | grep -o '\[.*$')
export CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL=$(grep -o 'CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_DEFAULT_SPEC_COMPONENTS_DASHBOARD_HEADERMESSAGE_TEXT=$(grep -o 'CHE_DEFAULT_SPEC_COMPONENTS_DASHBOARD_HEADERMESSAGE_TEXT:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DISABLECONTAINERBUILDCAPABILITIES=$(grep -o 'CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DISABLECONTAINERBUILDCAPABILITIES:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_WORKSPACE_PLUGIN__REGISTRY__INTERNAL__URL=$(grep -o 'CHE_WORKSPACE_PLUGIN__REGISTRY__INTERNAL__URL:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_WORKSPACE_DEVFILE__REGISTRY__INTERNAL__URL=$(grep -o 'CHE_WORKSPACE_DEVFILE__REGISTRY__INTERNAL__URL:.*' run/.che-dashboard-pod | grep -o '\S*$')
export CHE_WORKSPACE_DEVFILE__REGISTRY__INTERNAL__URL=$(grep -o 'CHE_WORKSPACE_DEVFILE__REGISTRY__INTERNAL__URL:.*' run/.che-dashboard-pod | grep -o '\S*$')

export OPENSHIFT_CONSOLE_URL=$(grep -o 'OPENSHIFT_CONSOLE_URL:.*' run/.che-dashboard-pod | grep -o '\S*$')
export OPENSHIFT_CONSOLE_TITLE=$(grep -o 'OPENSHIFT_CONSOLE_TITLE:.*' run/.che-dashboard-pod | grep -o '\S*$')
export OPENSHIFT_CONSOLE_ICON=$(grep -o 'OPENSHIFT_CONSOLE_ICON:.*' run/.che-dashboard-pod | grep -o '\S*$')
export OPENSHIFT_CONSOLE_GROUP=$(grep -o 'OPENSHIFT_CONSOLE_GROUP:.*' run/.che-dashboard-pod | grep -o '\S*$')

if [ "$CHE_IN_CHE" == "true" ]; then
  export CHE_INTERNAL_URL=$(grep -o 'CHE_INTERNAL_URL:.*' run/.che-dashboard-pod | grep -o '\S*$')
else
  unset CHE_INTERNAL_URL
fi


# consider renaming it to CHE_API_URL since it's not just host
export CHE_HOST=http://localhost:8080
export CHE_HOST_ORIGIN=$(kubectl get checluster -n $CHE_NAMESPACE $CHECLUSTER_CR_NAME -o=json | jq -r '.status.cheURL')

# do nothing
PRERUN_COMMAND="echo"

GATEWAY=$(kubectl get deployments.apps -n $CHE_NAMESPACE che-gateway --ignore-not-found -o=json | jq -e '.spec.template.spec.containers|any(.name == "oauth-proxy")')
if [ "$GATEWAY" == "true" ]; then
  echo "Detected gateway and oauth-proxy inside. Running in native auth mode."
  export NATIVE_AUTH="true"
  if [ "$CHE_IN_CHE" == "false" ]; then
      # when native auth we go though port forward to avoid dealing with OpenShift OAuth Cookies
      CHE_FORWARDED_PORT=8081
      export CHE_API_PROXY_UPSTREAM="http://localhost:${CHE_FORWARDED_PORT}"
      PRERUN_COMMAND="kubectl port-forward service/che-host ${CHE_FORWARDED_PORT}:8080 -n $CHE_NAMESPACE"
  else
    unset CHE_API_PROXY_UPSTREAM
  fi
fi

if [ ! -d packages/dashboard-backend/node_modules/@eclipse-che/common/lib ]; then
  ln -sr packages/common/lib packages/dashboard-backend/node_modules/@eclipse-che/common/lib
fi

# relative path from backend package
FRONTEND_RESOURCES=../../../../$DASHBOARD_FRONTEND/lib/public
$PRERUN_COMMAND &
yarn --cwd $DASHBOARD_BACKEND start:debug --publicFolder $FRONTEND_RESOURCES
