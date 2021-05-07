#!/bin/sh

# This is a support script for the Makefile to detect the Kubernetes plaform the caller is currently logged into.

K8S_CLI=$1

ROUTES_PRESENT=$(${K8S_CLI} api-resources --api-group='route.openshift.io'  2>&1 | grep -o routes)
if [ "${ROUTES_PRESENT}" == "routes" ]; then \
    echo openshift
else
    echo kubernetes
fi

