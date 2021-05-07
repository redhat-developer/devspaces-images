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
#
# convert devworkspace-operator upstream to downstream using yq, jq, sed & perl transforms, and deleting files

set -e

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPDATE_VENDOR=1 # update the vendor folder via bootstrap.Dockerfile

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/devworkspace-operator -t /tmp/devworkspace-controller
Options:
	--no-vendor # don't rebuild the vendor folder
"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    # for CSV_VERSION = 2.2.0, get CRW_VERSION = 2.2
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--no-vendor') UPDATE_VENDOR=0;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

CRW_RRIO="registry.redhat.io/codeready-workspaces"
CRW_DWCO_IMAGE="${CRW_RRIO}/devworkspace-rhel8:${CRW_VERSION}"
CRW_CONFIGBUMP_IMAGE="${CRW_RRIO}/configbump-rhel8:${CRW_VERSION}"
CRW_TRAEFIK_IMAGE="${CRW_RRIO}/traefik-rhel8:${CRW_VERSION}"

# step one - build the builder image
BUILDER=$(command -v podman || true)
if [[ ! -x $BUILDER ]]; then
  echo "[WARNING] podman is not installed, trying with docker"
  BUILDER=$(command -v docker || true)
  if [[ ! -x $BUILDER ]]; then
      echo "[ERROR] must install docker or podman. Abort!"; exit 1
  fi
fi

# global / generic changes
echo ".github/
.git/
.gitattributes
build/scripts/sync.sh
get-sources-jenkins.sh
container.yaml
content_sets.yml
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rm -fr ${TARGETDIR}/vendor/
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# remove k8s deployment files
rm -fr ${TARGETDIR}/deploy/deployment/kubernetes

# transform Dockefile
sed ${TARGETDIR}/build/dockerfiles/Dockerfile -r \
    -e "s#FROM registry.redhat.io/#FROM #g" \
    -e "s#FROM registry.access.redhat.com/#FROM #g" \
    -e "s/(RUN go mod download$)/#\1/g" \
    -e "s/(RUN go mod tidy)/#\1/g" \
    `# https://github.com/devfile/devworkspace-operator/issues/166 https://golang.org/doc/go1.13 DON'T use proxy for Brew` \
    -e "s@(RUN go env GOPROXY$)@#\1@g" \
    `# CRW-1680 use vendor folder (no internet); print commands (-x)` \
    -e "s@(go build \\\\)@\1 -mod=vendor -x \\\\@" \
    -e "s/# *RUN yum /RUN yum /g" \
> ${TARGETDIR}/Dockerfile
cat << EOT >> ${TARGETDIR}/Dockerfile
ENV SUMMARY="Red Hat CodeReady Workspaces devworkspace container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces devworkspace container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="devworkspace-rhel8"
LABEL summary="$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

if [[ ${UPDATE_VENDOR} -eq 1 ]]; then
    BOOTSTRAPFILE=${TARGETDIR}/bootstrap.Dockerfile
    # Angel says we don't neet go get and go mod download
    # gomodvendoring="go mod tidy || true; go get -d -t || true; go mod download || true; go mod vendor || true;"
    gomodvendoring="go mod tidy || true; go mod vendor || true;"
    cat ${TARGETDIR}/build/dockerfiles/Dockerfile | sed -r \
        `# https://github.com/devfile/devworkspace-operator/issues/166 DO use proxy for bootstrap` \
        -e "s@(RUN go env GOPROXY$)@\1=https://proxy.golang.org,direct@g" \
        `# CRW-1680 fetch new vendor content` \
        -e "s@(\ +)(.+go build)@\1${gomodvendoring} \2@" \
    > ${BOOTSTRAPFILE}
    tag=$(pwd);tag=${tag##*/}
    ${BUILDER} build . -f ${BOOTSTRAPFILE} --target builder -t ${tag}:bootstrap # --no-cache
    rm -f ${BOOTSTRAPFILE}

    # step two - extract vendor folder to tarball
    ${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - /workspace/vendor' > "asset-vendor-$(uname -m).tgz"

    pushd "${TARGETDIR}" >/dev/null || exit 1
        # step three - include that tarball's contents in this repo, under the vendor folder
        tar --strip-components=1 -xzf "asset-vendor-$(uname -m).tgz" 
        git add vendor || true
    popd || exit
    echo "Collected vendor/ folder - don't forget to commit it and sync it downstream"

    # cleanup
    #${BUILDER} rmi ${tag}:bootstrap
    # rm -f "asset-vendor-$(uname -m).tgz"
fi

# header to reattach to yaml files after yq transform removes it
COPYRIGHT="#
#  Copyright (c) 2021 Red Hat, Inc.
#    This program and the accompanying materials are made
#    available under the terms of the Eclipse Public License 2.0
#    which is available at https://www.eclipse.org/legal/epl-2.0/
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Contributors:
#    Red Hat, Inc. - initial API and implementation
"

replaceField()
{
  theFile="$1"
  updateName="$2"
  updateVal="$3"
  echo "[INFO] ${0##*/} :: * ${updateName}: ${updateVal}"
  changed=$(cat ${theFile} | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
    ${updateName}' = $updateVal')
  echo "${COPYRIGHT}${changed}" > "${theFile}"
}

pushd ${TARGETDIR} >/dev/null || exit 1

    # transform env vars in deployment yaml
    #    - name: RELATED_IMAGE_gateway                                          CRW_TRAEFIK_IMAGE
    #      value: docker.io/traefik:v2.2.8
    #    - name: RELATED_IMAGE_gateway_configurer                               CRW_CONFIGBUMP_IMAGE
    #      value: quay.io/che-incubator/configbump:0.1.4
    declare -A operator_replacements=(
        ["RELATED_IMAGE_gateway"]="${CRW_TRAEFIK_IMAGE}"
        ["RELATED_IMAGE_gateway_configurer"]="${CRW_CONFIGBUMP_IMAGE}"
    )
    while IFS= read -r -d '' d; do
        for updateName in "${!operator_replacements[@]}"; do
            changed="$(cat "${TARGETDIR}/${d}" | yq  -y --arg updateName "${updateName}" --arg updateVal "${operator_replacements[$updateName]}" \
            '.spec.template.spec.containers[].env = [.spec.template.spec.containers[].env[] | if (.name == $updateName) then (.value = $updateVal) else . end]')" && \
            echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${d}"
        done
        if [[ $(diff -u "${SOURCEDIR}/${d}" "${TARGETDIR}/${d}") ]]; then
            echo "Converted (yq #1) ${d}"
        fi
    done <   <(find deploy -type f -name "*Deployment.yaml" -print0)

    # remove env vars from deployment yaml
    declare -A operator_deletions=(
    )
    while IFS= read -r -d '' d; do
        for updateName in "${!operator_deletions[@]}"; do
            changed="$(cat "${TARGETDIR}/${d}" | yq  -y --arg updateName "${updateName}" 'del(.spec.template.spec.containers[0].env[] | select(.name == $updateName))')" && \
            echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${d}"
        done
        if [[ $(diff -u "${SOURCEDIR}/${d}" "${TARGETDIR}/${d}") ]]; then
            echo "Converted (yq #2) ${d}"
        fi
    done <   <(find deploy -type f -name "*Deployment.yaml" -print0)

    # replace image: quay.io/che-incubator/devworkspace-che-operator:v7.28.2 with CRW_DWCO_IMAGE
    while IFS= read -r -d '' d; do
        replaceField "${TARGETDIR}/${d}" ".spec.template.spec.containers[].image" "${CRW_DWCO_IMAGE}"
    done <   <(find deploy -type f -name "*Deployment.yaml" -print0)

    # sort env vars
    while IFS= read -r -d '' d; do
        cat "${TARGETDIR}/${d}" | yq -Y '.spec.template.spec.containers[].env |= sort_by(.name)' > "${TARGETDIR}/${d}.2"
        mv "${TARGETDIR}/${d}.2" "${TARGETDIR}/${d}"
    done <   <(find deploy -type f -name "*Deployment.yaml" -print0)

popd >/dev/null || exit
