#!/bin/bash

set -e
set -u

usage() {
  cat <<EOF
This script reverts changes made to enable local dashboard development flow against a remote Che Cluster.

EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
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

parse_args "$@"

CHE_HOST=http://localhost:8080
CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"
CHE_HOST_ORIGIN=$(oc get checluster -n $CHE_NAMESPACE eclipse-che -o=json | jq -r '.status.cheURL')
GATEWAY=$(kubectl get deployments.apps che-gateway -o=json --ignore-not-found -n $CHE_NAMESPACE)

if [[ -z "$GATEWAY" ||
  $(echo "$GATEWAY" | jq -e '.spec.template.spec.containers|any(.name == "oauth-proxy")') != "true" ]]; then
  echo 'Nothing needs to be patched.'
  echo 'Done.'
  exit 0
fi
echo 'Detected gateway with oauth-proxy...'

if kubectl get configMaps che-gateway-config-oauth-proxy -o jsonpath="{.data}" -n $CHE_NAMESPACE | yq e ".[\"oauth-proxy.cfg\"]" - | grep $CHE_HOST/oauth/callback; then
  echo 'Patching che-gateway-config-oauth-proxy config map...'
  CONFIG_YAML=$(kubectl get configMaps che-gateway-config-oauth-proxy -o jsonpath="{.data}" -n $CHE_NAMESPACE | yq e ".[\"oauth-proxy.cfg\"]" - | sed "s/${CHE_HOST//\//\\/}\/oauth\/callback/${CHE_HOST_ORIGIN//\//\\/}\/oauth\/callback/g")
  dq_mid=\\\"
  yaml_esc="${CONFIG_YAML//\"/$dq_mid}"
  kubectl get configMaps che-gateway-config-oauth-proxy -n $CHE_NAMESPACE -o json | jq ".data[\"oauth-proxy.cfg\"] |= \"${yaml_esc}\"" | kubectl replace -f -

  # rollout che-server deployment
  echo 'Rolling out che-gateway deployment...'
  oc patch deployment/che-gateway --patch "{\"spec\":{\"replicas\":0}}" -n $CHE_NAMESPACE
  oc patch deployment/che-gateway --patch "{\"spec\":{\"replicas\":1}}" -n $CHE_NAMESPACE
  echo 'Done.'
fi

if kubectl get deployment/che-operator -n $CHE_NAMESPACE -o jsonpath="{.spec.replicas}" | grep 0; then
  echo 'Turning on Che-operator deployment...'
  oc patch deployment/che-operator --patch "{\"spec\":{\"replicas\":1}}" -n $CHE_NAMESPACE
  echo 'Done.'
fi
