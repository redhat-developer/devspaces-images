#!/bin/bash
#
# Copyright (c) 2021-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# insert RELATED_IMAGE_ fields for images referenced by the plugin and devfile registries

set -e
# SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0
CRW_VERSION=${CSV_VERSION%.*}
MIDSTM_BRANCH=devspaces-3.y-rhel8

# TODO handle cmdline input
usage () {
	echo "Usage:   $0 -v [CRW CSV_VERSION] -t [/path/to/generated] --crw-branch ${MIDSTM_BRANCH}"
	echo "Example: $0 -v 2.y.0 -t $(pwd) --crw-branch devspaces-3.y-rhel8"
  exit
}

if [[ $# -lt 4 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
  # for CSV_VERSION = 2.y.0, get CRW_VERSION = 2.y
  '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
  '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
  '--crw-branch') MIDSTM_BRANCH="$2"; shift 1;; # branch of redhat-developer/devspaces/ - check registries' referenced images
	'--help'|'-h') usage;;
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

PLUGIN_REGISTRY_CONTAINERS=""
DEVFILE_REGISTRY_CONTAINERS=""
tmpdir=$(mktemp -d); mkdir -p $tmpdir; pushd $tmpdir >/dev/null
    # check out crw sources
    echo "    ${0##*/} :: Check out CRW registry sources from https://github.com/redhat-developer/devspaces/dependencies/"
    rm -fr crw && git clone -q https://github.com/redhat-developer/devspaces crw
    cd crw/
    git checkout ${MIDSTM_BRANCH} || true
    cd ..

    # collect containers referred to by devfiles
    DEVFILE_REGISTRY_CONTAINERS="${DEVFILE_REGISTRY_CONTAINERS} $(cd crw/dependencies/che-devfile-registry; ./build/scripts/list_referenced_images.sh devfiles/)"

    # collect containers referred to by plugins, but only the latest CRW_VERSION ones (might have older variants we don't need to include)
    PLUGIN_REGISTRY_CONTAINERS="${PLUGIN_REGISTRY_CONTAINERS} $(cd crw/dependencies/che-plugin-registry; ./build/scripts/list_referenced_images.sh ./ | grep ${CRW_VERSION})"
popd >/dev/null
rm -fr $tmpdir

# add unique containers to array, then sort
CONTAINERS_UNIQ=()
for c in $DEVFILE_REGISTRY_CONTAINERS; do if [[ ! "${CONTAINERS_UNIQ[@]}" =~ "${c}" ]]; then CONTAINERS_UNIQ+=($c); fi; done
IFS=$'\n' DEVFILE_REGISTRY_CONTAINERS=($(sort <<<"${CONTAINERS_UNIQ[*]}")); unset IFS
CONTAINERS_UNIQ=()
for c in $PLUGIN_REGISTRY_CONTAINERS; do if [[ ! "${CONTAINERS_UNIQ[@]}" =~ "${c}" ]]; then CONTAINERS_UNIQ+=($c); fi; done
IFS=$'\n' PLUGIN_REGISTRY_CONTAINERS=($(sort <<<"${CONTAINERS_UNIQ[*]}")); unset IFS

# same method used in both insert-related-images-to-csv.sh and sync-che-olm-to-devspaces-olm.sh
insertEnvVar()
{
  echo "    ${0##*/} :: * ${updateName}: ${updateVal}"
  cat $CSVFILE | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
    '.spec.install.spec.deployments[].spec.template.spec.containers[0].env += [{"name": $updateName, "value": $updateVal}]' \
    > ${CSVFILE}.2; mv ${CSVFILE}.2 ${CSVFILE}
}

CSVFILE=${TARGETDIR}/manifests/devspaces.csv.yaml

# The updated name should be like:
# RELATED_IMAGE_codeready_workspaces_stacks_cpp_plugin_registry_image_GIXDCMQK
# RELATED_IMAGE_codeready_workspaces_plugin_java11_devfile_registry_image_GIXDCMQK
# RELATED_IMAGE_jboss_eap_7_eap73_openjdk8_openshift_rhel7_devfile_registry_image_G4XDGLRWBI______
updateRelatedImageName() {
  imageType="$1"
  shift
  CONTAINERS=("$@")
  for updateVal in "${CONTAINERS[@]}"; do
    tagOrDigest=""
    if [[ ${updateVal} == *"@"* ]]; then
      tagOrDigest="@${updateVal#*@}"
    elif [[ ${updateVal} == *":"* ]]; then
      tagOrDigest="${updateVal#*:}"
    fi
    encodedTag=$(echo "${tagOrDigest}" | base32 -w 0 | tr "=" "_")
    updateName=$(echo "${updateVal}" | sed -r -e "s#[^/]+/([^/]+)/([^/]+):([0-9.-]+)#RELATED_IMAGE_\1_\2_${imageType}_${encodedTag}#g" -e "s@-rhel8@@g" | tr "-" "_")
    insertEnvVar
  done
}

updateRelatedImageName "plugin_registry_image" "${PLUGIN_REGISTRY_CONTAINERS[@]}"
updateRelatedImageName "devfile_registry_image" "${DEVFILE_REGISTRY_CONTAINERS[@]}"

# replace external crw refs with internal ones
sed -r -i $CSVFILE \
  -e "s@registry.access.redhat.com/ubi8-minimal@registry.redhat.io/ubi8-minimal@g" \
  -e "s@registry.access.redhat.com/ubi8/ubi-minimal@registry.redhat.io/ubi8/ubi-minimal@g" \
  `# CRW-1254 use ubi8/ubi-minimal for airgap mirroring` \
  -e "s@/ubi8-minimal@/ubi8/ubi-minimal@g"

# echo list of RELATED_IMAGE_ entries after adding them above
# cat $CSVFILE | grep RELATED_IMAGE_ -A1

