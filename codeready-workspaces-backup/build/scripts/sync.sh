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
# convert registry upper-midstream (crw repo, forked from upstream w/ different plugins) to lower-midstream (crw-images repo) using yq, sed

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="che-backup-server-rest"
MIDSTM_NAME="backup"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/crw-${MIDSTM_NAME}"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# ignore changes in these files
echo ".github/
.git/
.gitattributes
.dockerignore
build/scripts/sync.sh
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;

# transform Dockerfile
sed "${SOURCEDIR}/Dockerfile" \
    `# Strip registry from image references` \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
  > "${TARGETDIR}/Dockerfile"

cat << EOT >> "${TARGETDIR}/Dockerfile"

ENV SUMMARY="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="${MIDSTM_NAME}-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Mykola Morhun<mmorhun@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"
