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

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="che-kubernetes-image-puller"
MIDSTM_NAME="imagepuller"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/ds-${MIDSTM_NAME}"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
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
.gitignore
.dockerignore
.ci/
.vscode/
build/scripts/sync.sh
devfile.yaml
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
README.md
get-source*.sh
tests/basic-test.yaml
sources
make-release.sh
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;

# use upstream dockerfile as bootstrap one (to retrieve dependencies for offline build)
cp ${SOURCEDIR}/docker/Dockerfile ${TARGETDIR}/bootstrap.Dockerfile
# transform Dockerfile
sed -r "${SOURCEDIR}/docker/Dockerfile" \
  `# Remove registry so build works in Brew` \
  -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
  `# Replace go-toolset ubi8 with rhel8 version` \
  -e "s#ubi8/go-toolset#rhel8/go-toolset#g" \
  -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=false|' \
  -e 's|^# *(COPY resources.tgz .+)|\1|' \
  > "${TARGETDIR}/Dockerfile"

cat << EOT >> "${TARGETDIR}/Dockerfile"

ENV SUMMARY="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
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
      maintainer="Ilya Buziuk <ibuziuk@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"
