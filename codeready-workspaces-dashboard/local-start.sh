#!/bin/bash

# Simple script that helps to build local version to test easily
set -e
set -u

DASHBOARD_FRONTEND=packages/dashboard-frontend
DASHBOARD_BACKEND=packages/dashboard-backend

# check if frontend is ready; run build otherwise
if [ ! -d $DASHBOARD_FRONTEND/lib ] || [ -z "$(ls -A $DASHBOARD_FRONTEND/lib)" ]; then
    yarn --cwd $DASHBOARD_FRONTEND build
fi

# Init Che Namespace with the default value if it's not set
CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"

# guide backend to use the current cluster from kubeconfig
export LOCAL_RUN="true"
export KUBECONFIG=$HOME/.kube/config

# consider renaming it to CHE_API_URL since it's not just host
export CHE_HOST=http://localhost:8080
export CHE_API_PROXY_UPSTREAM=$(oc get checluster -n $CHE_NAMESPACE eclipse-che -o=json | jq -r '.status.cheURL')
yarn --cwd $DASHBOARD_BACKEND build:dev

# we use relative to the static server path which is starting with '../../' to serv the dashboard-frontend
# build output directory. In the case of docker build dashboard-frontend output directory will be copied
# into the './public' directory (default value for static server)
PUBLIC_FOLDER=../../../../$DASHBOARD_FRONTEND/lib

yarn --cwd $DASHBOARD_BACKEND start:debug --publicFolder $PUBLIC_FOLDER
