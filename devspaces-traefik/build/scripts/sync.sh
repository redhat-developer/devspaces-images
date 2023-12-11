#!/bin/bash
#
# Copyright (c) 2021-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert upstream repo to midstream devspaces-images repo using yq, sed

set -e

SCRIPT_DIR=$(dirname $(readlink -f "${BASH_SOURCE[0]}"))

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y
TRAEFIK_VERSION="" # read this from job-config.json
UPSTM_NAME="traefik"
MIDSTM_NAME="traefik"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 3.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/ds-${MIDSTM_NAME}"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    # special params for this sync
    '--traefik-version') TRAEFIK_VERSION="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi

# ignore changes in these files
echo ".github/
.git/
.gitignore
.dockerignore
.semaphoreci
.travis
.travis.yaml
.gitattributes
traefik.sample.toml
traefik.sample.yml
build/
tests/
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
/patches/README.md
README.md
get-source*.sh
tests/basic-test.yaml
make-release.sh
/Dockerfile
/build.Dockerfile
/debug.Dockerfile
/exp.Dockerfile
/script/codegen.Dockerfile
/script/code-gen.sh
/Makefile
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete "${SOURCEDIR}"/ "${TARGETDIR}"/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find "${TARGETDIR}"/ -name "*.sh" -exec chmod +x {} \;

# get job-config.json
SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi
configjson=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/devspaces/${SCRIPTS_BRANCH}/dependencies/job-config.json)

if [[ ! $TRAEFIK_VERSION ]]; then
  TRAEFIK_VERSION=$(echo "${configjson}" | jq -r --arg DS_VERSION "${DS_VERSION}" '.Jobs.traefik[$DS_VERSION].upstream_branch[1]');
fi

SOURCE_SHA=$(cd "${SOURCEDIR}"; git checkout "${TRAEFIK_VERSION}"; git rev-parse --short=4 HEAD || true)
echo "Using $TRAEFIK_VERSION = $SOURCE_SHA"

"${SCRIPT_DIR}/checkgoMod.sh" "${TARGETDIR}" || exit $?

# CRW-4966 browserify-sign@4.2.2
# CRW-4882 get-func-name@2.0.2
# to get a new resolved & integrity SHA values, run 
#   cd /tmp; mkdir foo; cd foo; yarn add browserify-sign@4.2.2 get-func-name@2.0.2
# then look in generated yarn.lock for the correct hashes
d=webui
# collect existing .dependencies; add new ones
pairs="$(jq -M -c '.dependencies' "$d"/package.json | tr -d "{}")"
pairs="$pairs,\"browserify-sign\": \"4.2.2\""
pairs="$pairs,\"get-func-name\": \"2.0.2\""
jq '.dependencies|={'"$pairs"'}' "$d"/package.json > "$d"/package.json_; mv "$d"/package.json{_,}
# replace resolution of older deps with new ones
sed -i "$d"/yarn.lock -r \
  -e "/browserify-sign\@\^4\.[0-9.]+:/{s/(browserify-sign.+):/\1, browserify-sign@4.2.2:/;n;\
  s/version \"4\.[0-9.]+\"/version \"4.2.2\"/;n;\
  s/browserify-sign-4.+/browserify-sign-4.2.2.tgz#e78d4b69816d6e3dd1c747e64e9947f9ad79bc7e\"/;n;\
  s#integrity .+#integrity sha512-1rudGyeYY42Dk6texmv7c4VcQ0EsvVbLwZkA+AQB7SxvXxmcD93jcHie8bzecJ+ChDlmAm2Qyu0+Ccg5uhZXCg==#}"
echo "Patched package.json and yarn.lock: browserify-sign @ 4.2.2"
sed -i "$d"/yarn.lock -r \
  -e "/get-func-name\@\^2\.[0-9.]+:/{s/(get-func-name.+):/\1, get-func-name@2.0.2:/;n;\
  s/version \"2\.[0-9.]+\"/version \"2.0.2\"/;n;\
  s/get-func-name-2.+/get-func-name-2.0.2.tgz#0d7cf20cd13fda808669ffa88f4ffc7a3943fc41\"/;n;\
  s#integrity .+#integrity sha512-8vXOvuE167CtIc3OyItco7N/dpRtBbYOsPsXCz7X/PMnlGjYjSGuZJgM1Y7mmew7BKf9BqvLX2tnOVy1BBUsxQ==#}"
echo "Patched package.json and yarn.lock: get-func-name @ 2.0.2"

# nothing to transform, so just copy from rhel.Dockerfile into root to replace the upstream one
cp -f "${TARGETDIR}"/build/rhel.Dockerfile "${TARGETDIR}"/Dockerfile

cat << EOT >> "${TARGETDIR}"/Dockerfile
ENV SUMMARY="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    TRAEFIK_VERSION="${TRAEFIK_VERSION}" \\
    PRODNAME="devspaces" \\
    COMPNAME="${MIDSTM_NAME}-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      license="EPLv2" \\
      maintainer="Samantha Dawley <sdawley@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"
