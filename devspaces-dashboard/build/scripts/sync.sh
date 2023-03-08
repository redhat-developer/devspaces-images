#!/bin/bash -e
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
# convert che-dashboard upstream to devspaces-dashboard downstream using yq, sed, and deleting files

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y
GET_YARN=1

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -v 3.y.0 -s ${HOME}/projects/dashboard -t /tmp/dashboard"
#echo "Options:
#    --no-vendor # don't rebuild the vendor folder"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    # for CSV_VERSION = 2.2.0, get DS_VERSION = 2.2
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--no-yarn') GET_YARN=0;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "3.y.0" ]; then usage; fi

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
/content_sets.*
/cvp.yml
/cvp-owners.yml
get-source*.sh
/README.adoc
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rm -fr ${TARGETDIR}/node_modules/
rm -fr ${TARGETDIR}/**/node_modules/
rm -fr ${TARGETDIR}/.yarn/
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# get job-config.json
SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi
configjson=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/devspaces/${SCRIPTS_BRANCH}/dependencies/job-config.json)

# get yarn version + download it for use in Brew; cannot use `npm i -g yarn` downstream so must install it this way
if [[ $GET_YARN -eq 1 ]]; then
  YARN_VERSION=$(echo "${configjson}" | jq -r --arg DS_VERSION "${DS_VERSION}" '.Other["YARN_VERSION"][$DS_VERSION]');
  YARN_TARGET_DIR=${TARGETDIR}/.yarn/releases
  echo "Install Yarn $YARN_VERSION into $YARN_TARGET_DIR ... "
  mkdir -p "${YARN_TARGET_DIR}"
  curl -sSL "https://github.com/yarnpkg/yarn/releases/download/v${YARN_VERSION}/yarn-${YARN_VERSION}.js" -o "${YARN_TARGET_DIR}/yarn-${YARN_VERSION}.js"
  chmod +x "${YARN_TARGET_DIR}/yarn-${YARN_VERSION}.js"
fi

cat << EOT >> ${TARGETDIR}/build/dockerfiles/brew.Dockerfile
ENV SUMMARY="Red Hat OpenShift Dev Spaces dashboard container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces dashboard container" \\
    PRODNAME="devspaces" \\
    COMPNAME="dashboard-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      license="EPLv2" \\
      maintainer="Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted brew.Dockerfile"

# apply DS branding styles
cp -f ${TARGETDIR}/packages/dashboard-frontend/assets/branding/branding{-devspaces,}.css

# process product.json template to apply DS branding
SHA_CHE=$(cd ${SOURCEDIR}; git rev-parse --short=4 HEAD)
VER_CHE=$(jq -r .version package.json)
if [[ $VER_CHE =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)-(SNAPSHOT|next) ]]; then # reduce the z digit, remove the snapshot suffix
  XX=${BASH_REMATCH[1]}
  YY=${BASH_REMATCH[2]}
  ZZ=${BASH_REMATCH[3]}
  let ZZ=ZZ-1 || ZZ=0; if [[ $ZZ -lt 0 ]]; then ZZ=0; fi # if result of a let == 0, bash returns 1
  VER_CHE="${XX}.${YY}.${ZZ}"
fi
echo "Using: VER_CHE = $VER_CHE (SHA_CHE = $SHA_CHE)"

# update version in package.json
jq --arg VER_CHE "${VER_CHE}" '.version=$VER_CHE' package.json > package.json1; mv package.json1 package.json

SHA_DS=$(cd ${TARGETDIR}; git rev-parse --short=4 HEAD)
echo "Using: DS_VERSION = $DS_VERSION (SHA_DS = $SHA_DS)"

DS_SHAs="${DS_VERSION} @ ${SHA_DS} #${BUILD_NUMBER} :: Eclipse Che Dashboard ${VER_CHE} @ ${SHA_CHE}"
DS_DOCS_BASEURL="https://access.redhat.com/documentation/en-us/red_hat_openshift_dev_spaces/${DS_VERSION}"
sed -r \
    -e "s|@@devspaces.version@@|${DS_SHAs}|g" \
    -e "s#@@devspaces.docs.baseurl@@#${DS_DOCS_BASEURL}#g" \
${TARGETDIR}/packages/dashboard-frontend/assets/branding/product.json.template > ${TARGETDIR}/packages/dashboard-frontend/assets/branding/product.json

# shellcheck disable=SC2086
# https://issues.redhat.com/browse/CRW-3292 - remove -next suffix
while IFS= read -r -d '' d; do
  if [[ $(grep -E "version.*-next" ${d}) ]]; then
  	sed -r -e 's|("version": "[0-9.]+)-next"|\1"|' -i "${d}"
	  echo "Updated version in ${d}"
  fi
done <   <(find ${TARGETDIR}/ -name "*.json" -type f -print0)

# https://issues.redhat.com/browse/CRW-3489 - remove che-theia from DS 3.6+
# https://issues.redhat.com/browse/CRW-3485 - disable che-idea from DS 3.3+ as we don't want to show tech preview editors in the dashboard
while IFS= read -r -d '' d; do
  # see che-plugin-registry/che-editors.yaml, then for metadata.name=che-incubator/che-idea/next; exclude 'che-idea'
  sed -i "${d}" -r -e "s@EXCLUDED_TARGET_EDITOR_NAMES = .+@EXCLUDED_TARGET_EDITOR_NAMES = ['che-idea', 'che-theia'];@"
  echo "Updated EXCLUDED_TARGET_EDITOR_NAMES in ${d}"
done <   <(find ${TARGETDIR}/ -name "SamplesListGallery.tsx" -type f -print0)

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;
