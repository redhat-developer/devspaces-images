#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)
BASE_DIR="$1"
QUIET=""

PODMAN=$(command -v podman)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] ${0##*/} :: podman is not installed."
  PODMAN=$(command -v docker)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] ${0##*/} :: docker is not installed. Aborting."; exit 1
  fi
fi
command -v yq >/dev/null 2>&1 || { echo "yq is not installed. Aborting."; exit 1; }
command -v skopeo >/dev/null 2>&1 || { echo "skopeo is not installed. Aborting."; exit 1; }
checkVersion() {
  if [[  "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ]]; then
    #echo "[INFO] $3 version $2 >= $1, can proceed."
    true
  else 
    echo "[ERROR] ${0##*/} :: Must install $3 version >= $1"
    exit 1
  fi
}
checkVersion 1.1 "$(skopeo --version | sed -e "s/skopeo version //")" skopeo

usage () {
	echo "Usage:   ${0##*/} [-w WORKDIR] -c [/path/to/csv.yaml] "
	echo "Example: ${0##*/} -w $(pwd) -c  $(pwd)/generated/eclipse-che/7.9.0/eclipse-che.v7.9.0.clusterserviceversion.yaml -t 7.9.0"
	echo "Example: ${0##*/} -w $(pwd) -c  $(pwd)/generated/devspaces/v2.1.1/devspaces.csv.yaml -t 2.1"
}

if [[ $# -lt 1 ]]; then usage; exit; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-w') BASE_DIR="$2"; shift 1;;
    '-c') CSV="$2"; shift 1;;
    '-t') TAG="$2"; shift 1;;
    '-q') QUIET="-q"; shift 0;;
    '--help'|'-h') usage; exit;;
  esac
  shift 1
done

if [[ ! $CSV ]] || [[ ! $TAG ]]; then usage; exit 1; fi

mkdir -p ${BASE_DIR}/generated

echo "[INFO] ${0##*/} :: Get images from CSV ${CSV}"

IMAGE_LIST=$(yq -r '.spec.install.spec.deployments[].spec.template.spec.containers[].env[] | select(.name | test("RELATED_IMAGE_.*"; "g")) | .value' "${CSV}" | sort | uniq)
OPERATOR_IMAGE=$(yq -r '.spec.install.spec.deployments[].spec.template.spec.containers[].image' "${CSV}")

REGISTRY_LIST=$(yq -r '.spec.install.spec.deployments[].spec.template.spec.containers[].env[] | select(.name | test("RELATED_IMAGE_.*_registry"; "g")) | .value' "${CSV}")
# echo "[DEBUG] ${0##*/} :: REGISTRY_LIST = ${REGISTRY_LIST}"
REGISTRY_IMAGES_ALL=""

getExternalImagesFromRegistry()
{
  thisReg=$1
  ${PODMAN} pull ${thisReg} ${QUIET} 2>&1 | grep -v "Not found" 
  REGISTRY_IMAGES="$(${PODMAN} run --rm  --entrypoint /bin/sh  ${thisReg} -c "cat /var/www/html/*/external_images.txt")"
}

for registry in ${REGISTRY_LIST}; do
  REGISTRY_IMAGES=""
  registry="${registry/\@sha256:*/:${TAG}}" # remove possible existing @sha256:... and use current tag instead
  getExternalImagesFromRegistry $registry
  if [[ ! ${REGISTRY_IMAGES} ]]; then
    registryalt=$(echo $registry | sed -r -e "s#(registry.redhat.io|quay.io)/devspaces/#registry-proxy.engineering.redhat.com/rh-osbs/devspaces-#g")
    getExternalImagesFromRegistry $registryalt
  fi
  echo "[INFO] ${0##*/} :: Found $(echo "${REGISTRY_IMAGES}" grep -v "Not found" | wc -l) images in registry"
  REGISTRY_IMAGES_ALL="${REGISTRY_IMAGES_ALL} ${REGISTRY_IMAGES}"
done

REGISTRY_IMAGES_ALL=$(tr ' ' '\n' <<< "${OPERATOR_IMAGE} ${IMAGE_LIST} ${REGISTRY_IMAGES_ALL}" | sort | uniq)
# for image in ${REGISTRY_IMAGES_ALL}; do echo $image; done

rm -Rf ${BASE_DIR}/generated/digests-mapping.txt
touch ${BASE_DIR}/generated/digests-mapping.txt
for image in ${REGISTRY_IMAGES_ALL}; do
  case ${image} in
    *@*)
      continue;;
    *)
      # for other build methods or for falling back to other registries when not found, can apply transforms here
      orig_image="${image}"
      alt_image=""
      digest=""
      if [[ -x ${SCRIPTS_DIR}/buildDigestMapAlternateURLs.sh ]]; then
        . ${SCRIPTS_DIR}/buildDigestMapAlternateURLs.sh
      fi
      if [[ ${digest} ]]; then
        if [[ ! "${QUIET}" ]]; then echo -n "[INFO] ${0##*/} :: * Got digest "; fi
        echo "    $digest # ${image}"
      else
        if [[ ! "${QUIET}" ]]; then echo "[INFO] ${0##*/} :: - Get digest for ${image}"; fi
        image="${orig_image}"
        digest="$(skopeo inspect --tls-verify=false docker://${image} 2>/dev/null | jq -r '.Digest')"
        if [[ ! "${QUIET}" ]]; then echo -n "[INFO] ${0##*/} :: = Got digest "; fi
        echo "    $digest # ${orig_image}"
        if [[ ! ${digest} ]]; then
          echo "[ERROR] ${0##*/} :: Could not retrieve digest for '${orig_image}' or '${alt_image}': fail!"; exit 1
        fi
      fi
      withoutTag="$(echo "${image}" | sed -e 's/^\(.*\):[^:]*$/\1/')"
      withDigest="${withoutTag}@${digest}";;
  esac
  dots="${withDigest//[^\.]}"
  separators="${withDigest//[^\/]}"
  if [ "${#separators}" == "1" ] && [ "${#dots}" == "0" ]; then
    echo "[WARN] ${0##*/} :: Add 'docker.io/' prefix to $image"
    withDigest="docker.io/${withDigest}"
  fi

  echo "${image}=${withDigest}" >> ${BASE_DIR}/generated/digests-mapping.txt
done

cat ${BASE_DIR}/generated/digests-mapping.txt | sort | uniq > ${BASE_DIR}/generated/digests-mapping.txt2
mv ${BASE_DIR}/generated/digests-mapping.txt2 ${BASE_DIR}/generated/digests-mapping.txt
