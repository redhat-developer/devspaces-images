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
DS_VERSION=${CSV_VERSION%.*}
MIDSTM_BRANCH=devspaces-3.y-rhel8

# TODO handle cmdline input
usage () {
	echo "Usage:   $0 -v [Dev Spaces CSV_VERSION] -t [/path/to/generated] --ds-branch ${MIDSTM_BRANCH}"
	echo "Example: $0 -v 2.y.0 -t $(pwd) --ds-branch devspaces-3.y-rhel8"
  exit
}

if [[ $# -lt 4 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
  # for CSV_VERSION = 2.y.0, get DS_VERSION = 2.y
  '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
  '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
  '--ds-branch') MIDSTM_BRANCH="$2"; shift 1;; # branch of redhat-developer/devspaces/ - check registries' referenced images
	'--help'|'-h') usage;;
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

PODMAN=$(command -v podman)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] ${0##*/} :: podman is not installed."
  PODMAN=$(command -v docker)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] ${0##*/} :: docker is not installed. Aborting."; exit 1
  fi
fi

PLUGIN_REGISTRY_CONTAINERS=""
DEVFILE_REGISTRY_CONTAINERS=""
tmpdir=$(mktemp -d); mkdir -p $tmpdir; pushd $tmpdir >/dev/null
    # extract registry containers to get external_images.txt
    curl -sSLO https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/product/containerExtract.sh && chmod +x containerExtract.sh
    ./containerExtract.sh quay.io/devspaces/devfileregistry-rhel8:${DS_VERSION} --tar-flags var/www/html/*/external_images.txt --delete-before &
    ./containerExtract.sh quay.io/devspaces/pluginregistry-rhel8:${DS_VERSION} --tar-flags var/www/html/*/external_images.txt --delete-before &
    wait

    # CRW-3432 fail if we can't find the external_images.txt files
    if [[ ! $(cat /tmp/quay.io-devspaces-devfileregistry-rhel8-${DS_VERSION}*/var/www/html/*/external_images.txt) ]]; then
      echo "[ERROR] Cannot resolve devfileregistry external_images.txt!"
      exit 2
    fi
    if [[ ! $(cat /tmp/quay.io-devspaces-pluginregistry-rhel8-${DS_VERSION}*/var/www/html/*/external_images.txt) ]]; then
      echo "[ERROR] Cannot resolve pluginregistry external_images.txt!"
      exit 3
    fi

    # CRW-3177, CRW-3178 sort uniquely; replace quay refs with RHEC refs
    EXTERNAL_IMAGES=$(cat /tmp/quay.io-devspaces-{devfile,plugin}registry-rhel8-${DS_VERSION}*/var/www/html/*/external_images.txt | \
      sed -r -e "s#quay.io/devspaces/#registry.redhat.io/devspaces/#g" | sort -uV)

    # CRW-3432 fail if we don't get a list of images
    if [[ ! $EXTERNAL_IMAGES ]]; then exit 4; fi
    echo EXTERNAL_IMAGES=
    echo "${EXTERNAL_IMAGES[@]}"
popd >/dev/null
# cleanup
rm -fr $tmpdir /tmp/quay.io-devspaces-{devfile,plugin}registry-rhel8-${DS_VERSION}*/
$PODMAN rmi -f quay.io/devspaces/pluginregistry-rhel8:${DS_VERSION} quay.io/devspaces/devfileregistry-rhel8:${DS_VERSION} || true
# convert strings to arrays
DEVFILE_REGISTRY_CONTAINERS=(${EXTERNAL_IMAGES})
PLUGIN_REGISTRY_CONTAINERS=(${EXTERNAL_IMAGES})

# same method used in both insert-related-images-to-csv.sh and sync-che-olm.sh
insertEnvVar()
{
  echo "    ${0##*/} :: * ${updateName}: ${updateVal}"
  cat $CSVFILE | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
    '.spec.install.spec.deployments[].spec.template.spec.containers[0].env += [{"name": $updateName, "value": $updateVal}]' \
    > ${CSVFILE}.2; mv ${CSVFILE}.2 ${CSVFILE}
}

CSVFILE=${TARGETDIR}/manifests/devspaces.csv.yaml

# The updated name should be like:
# RELATED_IMAGE_devspaces_udi_plugin_registry_image_GIXDCMQK
# RELATED_IMAGE_devspaces_udi_devfile_registry_image_GIXDCMQK
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

# replace external devspaces refs with internal ones, and quay refs (from v2 devfiles) with RHEC ones
sed -r -i $CSVFILE \
  -e "s@registry.access.redhat.com/ubi8-minimal@registry.redhat.io/ubi8-minimal@g" \
  -e "s@registry.access.redhat.com/ubi8/ubi-minimal@registry.redhat.io/ubi8/ubi-minimal@g" \
  `# CRW-1254 use ubi8/ubi-minimal for airgap mirroring` \
  -e "s@/ubi8-minimal@/ubi8/ubi-minimal@g" \
  `# replace quay urls with RHEC urls` \
  -e "s|quay.io/devspaces/(.+)|registry.redhat.io/devspaces/\\1|g"

# echo list of RELATED_IMAGE_ entries after adding them above
# cat $CSVFILE | grep RELATED_IMAGE_ -A1

