#!/bin/sh

# This script generates a minimal kubeconfig file that is able to connect to the cluster (connected to 
# in the currently active kube config) and using the provided service account in the provided namespace
# as the current user.

set -e

OUTPUT_DIR=$1
SERVICE_ACCOUNT=$2
NAMESPACE=$3

FILE=$(mktemp -p $OUTPUT_DIR -t restricted-kube-config-XXXXXXXXXXX)

CLI=kubectl
if which oc > /dev/null 2>&1; then
    CLI=oc
fi

if ! which $CLI > /dev/null 2>&1; then
    echo "Could not find $CLI executable" >&2
    exit 1
fi

# sed is used to remove color control codes from the output of kubectl cluster-info
SERVER=$($CLI cluster-info | sed -e 's/\x1b\[.\{1,5\}m//g' | grep master | cut -d' ' -f6)

TOKEN_NAME=$($CLI -n $NAMESPACE get serviceaccounts/$SERVICE_ACCOUNT -o jsonpath='{.secrets[0].name}')
TOKEN=$($CLI -n $NAMESPACE get secret $TOKEN_NAME -o jsonpath='{.data.token}' | base64 --decode)

${CLI} --kubeconfig $FILE config set-credentials user --token=${TOKEN} > /dev/null
${CLI} --kubeconfig $FILE config set-cluster cluster --server=${SERVER} --insecure-skip-tls-verify=true > /dev/null
${CLI} --kubeconfig $FILE config set-context ctx --user=user --cluster=cluster > /dev/null
${CLI} --kubeconfig $FILE config use-context ctx > /dev/null

echo $FILE
