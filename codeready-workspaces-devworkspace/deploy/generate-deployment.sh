#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# This script builds complete deployment files for the DevWorkspace Che Operator,
# filling all environment variables as appropriate. The output, stored in
# deploy/deployment, contains subfolders for OpenShift and Kubernetes. Within each
# is a file, combined.yaml, which stores all the objects involved in deploying
# the operator, and a subfolder, objects, which stores separate yaml files for
# each object in combined.yaml, with the name <object-name>.<object-kind>.yaml
#
# Accepts parameter `--use-defaults`, which will generate static files based on
# default environment variables. Otherwise, current environment variables are
# respected.
#
# Note: The configmap generated when using `--use-defaults` will have an empty
# value for devworkspace.routing.cluster_host_suffix as there is no suitable
# default.
#
# Note: This script is a very much inspired by a similar script in 
# the https://github.com/devfile/devworkspace-operator.

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd)

source "${SCRIPT_DIR%/}/defaults.sh"
DEFAULT_OUTPUT_DIR="${SCRIPT_DIR%/}/deployment"
DEFAULT_DWCO_GENERATED_OVERLAY=everything

function print_help() {
  echo "Usage: generate-deployment.sh [ARGS]"
  echo "Arguments:"
  echo "  --use-defaults"
  echo "      Output deployment files to deploy/deployment, using default"
  echo "      environment variables rather than current shell variables."
  echo "      Implies '--split yaml'
  --default-image
      Controller (and webhook) image to use for the default deployment.
      Used only when '--use-defaults' is passed; otherwise, the value of
      the IMG environment variable is used. If unspecified, the default
      value of 'quay.io/che-incubator/devworkspace-che-operator:ci' is used"
  echo "  --split-yaml"
  echo "      Parse output file combined.yaml into a yaml file for each record"
  echo "      in combined yaml. Files are output to the 'objects' subdirectory"
  echo "      for each platform and are named <object-name>.<kind>.yaml"
  echo "  -h, --help"
  echo "      Print this help description"
  echo ""
  echo "These are the values of the environment variables used with --use-defaults:"
  echo ""
  echo "DWCO_NAMESPACE=${DEFAULT_DWCO_NAMESPACE}"
  echo "DWCO_IMG=${DEFAULT_DWCO_IMG}"
  echo "DWCO_PULL_POLICY=${DEFAULT_DWCO_PULL_POLICY}"
  echo "DWCO_GENERATED_OVERLAY=${DEFAULT_DWCO_GENERATED_OVERLAY}"
  echo "OUTPUT_DIR=${DEFAULT_OUTPUT_DIR}"
}

#
# argument parsing
#

USE_DEFAULT_ENV=false
SPLIT_YAMLS=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
      --use-defaults)
      USE_DEFAULT_ENV=true
      SPLIT_YAMLS=true
      ;;
      --default-image)
      DEFAULT_IMAGE=$2
      shift
      ;;
      --split-yaml|--split-yamls)
      SPLIT_YAMLS=true
      ;;
      -h|--help)
      print_help
      exit 0
      ;;
      *)
      echo "Unknown parameter passed: $1"
      print_help
      exit 1
      ;;
  esac
  shift
done

if $USE_DEFAULT_ENV; then
    export DWCO_NAMESPACE="${DEFAULT_DWCO_NAMESPACE}"
    export DWCO_IMG="${DEFAULT_DWCO_IMG}"
    export DWCO_PULL_POLICY="${DEFAULT_DWCO_PULL_POLICY}"
    export DWCO_GENERATED_OVERLAY="${DEFAULT_DWCO_GENERATED_OVERLAY}"
    export OUTPUT_DIR="${DEFAULT_OUTPUT_DIR}"
else
    export DWCO_NAMESPACE="${DWCO_NAMESPACE:-$DEFAULT_NAMESPACE}"
    export DWCO_IMG=${DWCO_IMG:-$DEFAULT_IMG}
    export DWCO_PULL_POLICY=${DWCO_PULL_POLICY:-$DEFAULT_PULL_POLICY}
    export DWCO_GENERATED_OVERLAY="${DWCO_GENERATED_OVERLAY:-$DEFAULT_DWCO_GENERATED_OVERLAY}"
    export OUTPUT_DIR=${OUTPUT_DIR:-$DEFAULT_OUTPUT_DIR}
fi

echo "Using DWCO_NAMESPACE=${DWCO_NAMESPACE}"
echo "Using DWCO_IMG=${DWCO_IMG}"
echo "Using DWCO_PULL_POLICY=${DWCO_PULL_POLICY}"
echo "Using DWCO_GENERATED_OVERLAY=${DWCO_GENERATED_OVERLAY}"
echo "Using OUTPUT_DIR=${OUTPUT_DIR}"

#
# main script
#

KUBERNETES_DIR="${OUTPUT_DIR}/kubernetes"
OPENSHIFT_DIR="${OUTPUT_DIR}/openshift"
COMBINED_FILENAME="combined.yaml"
OBJECTS_DIR="objects"

KUSTOMIZE_VER=4.0.5
KUSTOMIZE_DIR="${SCRIPT_DIR}/../bin/kustomize"
KUSTOMIZE=${KUSTOMIZE_DIR}/kustomize

rm -rf $KUBERNETES_DIR $OPENSHIFT_DIR
mkdir -p "$KUBERNETES_DIR" "$OPENSHIFT_DIR"

mkdir -p "$KUSTOMIZE_DIR"
if [ ! -f "$KUSTOMIZE" ]; then
  curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" \
    | bash -s "$KUSTOMIZE_VER" "$KUSTOMIZE_DIR"
elif [ $("$KUSTOMIZE" version | grep -o 'Version:[^ ]*') != "Version:kustomize/v${KUSTOMIZE_VER}" ]; then
  echo "Wrong version of kustomize at ${KUSTOMIZE}. Redownloading."
  rm "$KUSTOMIZE"
  curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" \
    | bash -s "$KUSTOMIZE_VER" "$KUSTOMIZE_DIR"
fi

for bin in envsubst csplit yq; do
    if ! which "${bin}" &> /dev/null; then
        echo "ERROR: Program $bin is required by this script but it could not be found on PATH."
        exit 1
    fi
done

echo "Using kustomize $(${KUSTOMIZE} version)"
echo "Using envsubst $(envsubst --version | head -1 | cut -d' ' -f4)"
echo "Using csplit $(csplit --version | head -1 | cut -d' ' -f4)"
echo "Using yq $(yq --version | head -1 | cut -d' ' -f2)"

#space separated list of templates to interpolate
TEMPLATES="templates/overlays/support/kustomization.yaml templates/overlays/everything/kustomization.yaml templates/overlays/everything/manager_image_patch.yaml"

for t in $TEMPLATES; do
    # save backups and do env substitution in the originals
    mv "${SCRIPT_DIR}/${t}" "${SCRIPT_DIR}/${t}.bak"
    envsubst < "${SCRIPT_DIR}/${t}.bak" > "${SCRIPT_DIR}/${t}"
done

# run kustomize on the substituted templates
echo "Generating config for Kubernetes"
${KUSTOMIZE} build "${SCRIPT_DIR}/templates/overlays/${DWCO_GENERATED_OVERLAY}" > "${KUBERNETES_DIR}/${COMBINED_FILENAME}"
echo "File saved to ${KUBERNETES_DIR}/${COMBINED_FILENAME}"

# for now, this is the same as for kubernetes. I assume they will start to diverge as soon as we start
# playing with auth.
echo "Generating config for OpenShift"
${KUSTOMIZE} build "${SCRIPT_DIR}/templates/overlays/${DWCO_GENERATED_OVERLAY}" > "${OPENSHIFT_DIR}/${COMBINED_FILENAME}"
echo "File saved to ${OPENSHIFT_DIR}/${COMBINED_FILENAME}"

# Restore the backups
for t in $TEMPLATES; do
    mv "${SCRIPT_DIR}/${t}.bak" "${SCRIPT_DIR}/${t}"
done

if $SPLIT_YAMLS; then
  for dir in "$KUBERNETES_DIR" "$OPENSHIFT_DIR"; do
    echo "Parsing objects from ${dir}/${COMBINED_FILENAME}"
    mkdir -p "$dir/$OBJECTS_DIR"
    # Have to move into subdirectory as csplit outputs to the current working dir
    pushd "$dir" &>/dev/null
    # Split combined.yaml into separate files for each record, with names temp01,
    # temp02, etc. Then rename each temp file according to the .metadata.name and
    # .kind of the object
    csplit -s -f "temp" --suppress-matched "${dir}/combined.yaml" '/^---$/' '{*}'
    for file in temp??; do
        name_kind=$(yq -r '"\(.metadata.name).\(.kind)"' "$file")
        mv "$file" "objects/${name_kind}.yaml"
    done
    popd &>/dev/null
  done
fi
