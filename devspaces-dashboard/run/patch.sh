#!/bin/bash

set -e

if [[ -z "$IMAGE_REGISTRY_HOST" ]]; then
  echo 'Environment variable IMAGE_REGISTRY_HOST does not found.'
  exit 0
fi

if [[ -z "$IMAGE_REGISTRY_USER_NAME" ]]; then
  echo 'Environment variable IMAGE_REGISTRY_USER_NAME does not found.'
  exit 0
fi

TAG=$(git branch --show-current)'_'$(date '+%Y_%m_%d_%H_%M_%S')
CHE_DASHBOARD_IMAGE="${IMAGE_REGISTRY_HOST}/${IMAGE_REGISTRY_USER_NAME}/che-dashboard:${TAG}"

echo "[INFO] Build a new image '${CHE_DASHBOARD_IMAGE}'..."

"${PWD}/scripts/container_tool.sh" build . -f build/dockerfiles/skaffold.Dockerfile -t $CHE_DASHBOARD_IMAGE

echo "[INFO] Push the image '${CHE_DASHBOARD_IMAGE}'..."

"${PWD}/scripts/container_tool.sh" push $CHE_DASHBOARD_IMAGE

echo "[INFO] Patching checluster with the new dashboard image '${CHE_DASHBOARD_IMAGE}'..."

CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"
DASHBOARD_POD_NAME=$(kubectl get pods -n $CHE_NAMESPACE -o=custom-columns=:metadata.name | grep dashboard)
CHECLUSTER_CR_NAME=$(kubectl exec $DASHBOARD_POD_NAME -n $CHE_NAMESPACE -- printenv CHECLUSTER_CR_NAME)
PREVIOUS_CHE_DASHBOARD_IMAGE=$(kubectl get checluster -n $CHE_NAMESPACE $CHECLUSTER_CR_NAME -o=json | jq -r '.spec.components.dashboard.deployment.containers[0].image')

if [ "$PREVIOUS_CHE_DASHBOARD_IMAGE" == "null" ]; then
  kubectl patch -n "$CHE_NAMESPACE" "checluster/$CHECLUSTER_CR_NAME" --type=json -p="[{\"op\": \"replace\", \"path\": \"/spec/components/dashboard\", \"value\": {deployment: {containers: [{image: \"${CHE_DASHBOARD_IMAGE}\", name: che-dasboard}]}}}]"
else
  kubectl patch -n "$CHE_NAMESPACE" "checluster/$CHECLUSTER_CR_NAME" --type=json -p="[{\"op\": \"replace\", \"path\": \"/spec/components/dashboard/deployment/containers/0/image\", \"value\": ${CHE_DASHBOARD_IMAGE}}]"
fi

echo 'Done.'
