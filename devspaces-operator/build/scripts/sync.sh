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
# convert upstream che repo to midstream devspaces-images repo using yq, sed

set -e

SCRIPT_DIR=$(dirname $(readlink -f "${BASH_SOURCE[0]}"))

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y

UPSTM_NAME="operator"
MIDSTM_NAME="operator"

DEV_WORKSPACE_CONTROLLER="" # main or 0.y.x
DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="" # main or v0.y.z

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] -s [/path/to/${UPSTM_NAME}] -t [/path/to/generated] [--dwob DEV_WORKSPACE_CONTROLLER branch] [--hrtpb DEV_HEADER_REWRITE_TRAEFIK_PLUGIN branch]
Example: $0 -v 3.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/ds-${MIDSTM_NAME} --dwob v0.13.0 --hrtpb v0.1.2
Example: $0 -v 3.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/ds-${MIDSTM_NAME} --dwob main  --hrtpb main"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--dwob'|'--dwcv') DEV_WORKSPACE_CONTROLLER="$2"; shift 1;;
    '--hrtpb'|'--hrtpv') DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="$2"; shift 1;;
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
.ci/
.vscode/
build/
devfiles.yaml
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
PROJECT
README.md
RELEASE.md
REQUIREMENTS
get-source*.sh
tests/basic-test.yaml
sources
make-release.sh
build/scripts/insert-related-images-to-csv.sh
helmcharts/
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete "${SOURCEDIR}"/ "${TARGETDIR}"/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find "${TARGETDIR}"/ -name "*.sh" -exec chmod +x {} \;

sed "${TARGETDIR}/build/dockerfiles/Dockerfile" --regexp-extended \
  `# Replace ubi8 with rhel8 version` \
  -e "s#ubi8/go-toolset#rhel8/go-toolset#g" \
  `# Remove registry so build works in Brew` \
  -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
  > "${TARGETDIR}/Dockerfile"

cat << EOT >> "${TARGETDIR}"/Dockerfile
ENV SUMMARY="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    PRODNAME="devspaces" \\
    COMPNAME="${MIDSTM_NAME}"
LABEL com.redhat.delivery.appregistry="false" \\
      summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-rhel8-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      license="EPLv2" \\
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

"${TARGETDIR}"/build/scripts/sync-che-operator.sh -v "${CSV_VERSION}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"
