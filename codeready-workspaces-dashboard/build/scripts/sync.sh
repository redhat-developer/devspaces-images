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
# convert che-dashboard upstream to crw-dashboard downstream using yq, sed, and deleting files

set -e

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPDATE_VENDOR=0 # vendoring will be done in get-sources*.sh just before the brew build, so we can also commit the tarball

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/dashboard -t /tmp/dashboard"
#echo "Options:
#    --no-vendor # don't rebuild the vendor folder"
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
    # '--no-vendor') UPDATE_VENDOR=0;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

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
packages/dashboard-frontend/assets/branding/
build/scripts/
container.yaml
content_sets.yml
get-source*.sh
sources
/README.adoc
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rm -fr ${TARGETDIR}/node_modules/
rm -fr ${TARGETDIR}/**/node_modules/
rm -fr ${TARGETDIR}/.yarn/
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# get yarn version

# get job-config.json
SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ $SCRIPTS_BRANCH != "crw-2."*"-rhel-8" ]]; then
    SCRIPTS_BRANCH="crw-2-rhel-8"
fi
# echo "Load https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${SCRIPTS_BRANCH}/dependencies/job-config.json [3]"
configjson=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${SCRIPTS_BRANCH}/dependencies/job-config.json)
YARN_VERSION=$(echo "${configjson}" | jq -r --arg CRW_VERSION "${CRW_VERSION}" '.Other["YARN_VERSION"][$CRW_VERSION]');
YARN_TARGET_DIR=${TARGETDIR}/.yarn/releases
echo "Install Yarn $YARN_VERSION into $YARN_TARGET_DIR ... "
mkdir -p ${YARN_TARGET_DIR}
curl -L https://github.com/yarnpkg/yarn/releases/download/v${YARN_VERSION}/yarn-${YARN_VERSION}.js -o ${YARN_TARGET_DIR}/yarn-${YARN_VERSION}.js
chmod +x ${YARN_TARGET_DIR}/yarn-${YARN_VERSION}.js

pushd "${TARGETDIR}" >/dev/null

popd >/dev/null

# transform rhel.Dockerfile -> Dockerfile
sed -r \
    `# Strip registry from image references` \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
    `# CRW-2012 don't install unbound-libs` \
    -e 's|(RUN yum .+ update)(.+)|\1 --exclude=unbound-libs\2|' \
    `# copy yarn binary` \
    -e '/COPY yarn.lock/a \
COPY .yarn/releases /dashboard/.yarn/releases/' \
    -e '/RUN npm i -g yarn/d' \
    `# insert logic to unpack asset-node-modules-cache.tgz into /dashboard/node-modules` \
    -e '/RUN yarn install/c \
COPY asset-node-modules-cache.tgz /tmp/\
RUN tar xzf /tmp/asset-node-modules-cache.tgz && rm -f /tmp/asset-node-modules-cache.tgz' \
    -e 's|(RUN) yarn (build)|\1 /dashboard/.yarn/releases/yarn-\*\.\*js \2|' \
${TARGETDIR}/build/dockerfiles/rhel.Dockerfile > ${TARGETDIR}/Dockerfile
cat << EOT >> ${TARGETDIR}/Dockerfile
ENV SUMMARY="Red Hat CodeReady Workspaces dashboard container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces dashboard container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="dashboard-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Josh Pinkney <jpinkney@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT

# Patch rhel.Dockerfile
sed -r -i \
  -e '/COPY yarn.lock/a \
COPY .yarn/releases /dashboard/.yarn/releases/' \
  -e '/RUN npm i -g yarn/d' \
  -e 's|(RUN) yarn (install)|\1 /dashboard/.yarn/releases/yarn-\*\.\*js \2|' \
  -e 's|(RUN) yarn (build)|\1 /dashboard/.yarn/releases/yarn-\*\.\*js \2|' \
  ${TARGETDIR}/build/dockerfiles/rhel.Dockerfile

echo "Converted Dockerfile"

# add ignore for the tarball in mid and downstream
echo "/asset-node-modules-cache.tgz" >> ${TARGETDIR}/.gitignore
echo "Adjusted .gitignore"

# apply CRW branding styles
cp -f ${TARGETDIR}/packages/dashboard-frontend/assets/branding/branding{-crw,}.css

# process product.json template to apply CRW branding
SHA_CHE=$(cd ${SOURCEDIR}; git rev-parse --short=4 HEAD)
VER_CHE=$(jq -r .version package.json)
if [[ $VER_CHE =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)-SNAPSHOT ]]; then # reduce the z digit, remove the snapshot suffix
  XX=${BASH_REMATCH[1]}
  YY=${BASH_REMATCH[2]}
  ZZ=${BASH_REMATCH[3]}; (( ZZ=ZZ-1 )); if [[ ZZ -lt 0 ]]; then ZZ=0; fi
  VER_CHE="${XX}.${YY}.${ZZ}"
fi
echo "Using: VER_CHE = $VER_CHE (SHA_CHE = $SHA_CHE)"

SHA_CRW=$(cd ${TARGETDIR}; git rev-parse --short=4 HEAD)
echo "Using: CRW_VERSION = $CRW_VERSION (SHA_CRW = $SHA_CRW)"

CRW_SHAs="${CRW_VERSION} @ ${SHA_CRW} #${BUILD_NUMBER} :: Eclipse Che Dashboard ${VER_CHE} @ ${SHA_CHE}"
CRW_DOCS_BASEURL="https://access.redhat.com/documentation/en-us/red_hat_codeready_workspaces/${CRW_VERSION}"
sed -r \
    -e "s|@@crw.version@@|${CRW_SHAs}|g" \
    -e "s#@@crw.docs.baseurl@@#${CRW_DOCS_BASEURL}#g" \
${TARGETDIR}/packages/dashboard-frontend/assets/branding/product.json.template > ${TARGETDIR}/packages/dashboard-frontend/assets/branding/product.json

# do vendoring downstream as part of get-source*.sh (if nothing is arch-specific, we can do it later)
# if [[ ${UPDATE_VENDOR} -eq 1 ]]; then
#     BOOTSTRAPFILE=${TARGETDIR}/bootstrap.Dockerfile
#     # with yarn 2, no need to change the dockerfile (unlike with go vendoring or yarn 1)
#     cp ${TARGETDIR}/build/dockerfiles/rhel.Dockerfile ${BOOTSTRAPFILE}
#     tag=$(pwd);tag=${tag##*/}
#     ${BUILDER} build . -f ${BOOTSTRAPFILE} --target builder -t ${tag}:bootstrap # --no-cache
#     rm -f ${BOOTSTRAPFILE}

#     # step two - extract cache folder to tarball
#     ${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - .yarn/cache' > "asset-yarn-cache-$(uname -m).tgz"

#     pushd "${TARGETDIR}" >/dev/null || exit 1
#         # step three - include that tarball's contents in this repo, under the cache folder
#         tar -xzf "asset-yarn-cache-$(uname -m).tgz"
#         git add .yarn/cache || true
#     popd || exit
#     echo "Collected .yarn/cache/ folder - don't forget to commit it and sync it downstream"

#     # cleanup
#     rm -f "${TARGETDIR}/asset-vendor-$(uname -m).tgz"
#     ${BUILDER} rmi ${tag}:bootstrap
# fi

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;
