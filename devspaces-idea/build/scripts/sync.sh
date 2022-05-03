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
# convert upstream che repo to midstream crw-images repo using yq, sed

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="jetbrains-editor-images"
MIDSTM_NAME="idea"

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
echo ".git/
.github/
README.md
asset-required-rpms.txt
build/docker/
build/scripts/sync.sh
compatible-ide.json
container.yaml
content_sets.*
cvp-owners.yml
cvp.yml
devfile.yaml
devfiles/
doc/
get-source*.sh
kubernetes/
make-release.sh
sources
tests/basic-test.yaml
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete "${SOURCEDIR}"/ "${TARGETDIR}"/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find "${TARGETDIR}"/ -name "*.sh" -exec chmod +x {} \;

sed_in_place() {
    SHORT_UNAME=$(uname -s)
  if [ "$(uname)" == "Darwin" ]; then
    sed -i '' "$@"
  elif [ "${SHORT_UNAME:0:5}" == "Linux" ]; then
    sed -i "$@"
  fi
}

sed_in_place -r \
  `# Update ubi8 image name` \
  -e "s#ubi8/ubi:#ubi8:#g" \
  `# Remove registry so build works in Brew` \
  -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
  `# Remove unused Python packages (support for PyCharm not included in CRW)` \
  -e "/python2 python39 \\\\/d" \
  "${TARGETDIR}"/Dockerfile

# Overwrite packages to be installed
cat << EOT > "${TARGETDIR}"/asset-required-rpms.txt
libsecret libsecret-devel
EOT

# Overwrite default configuration
cat << EOT > "${TARGETDIR}"/compatible-ide.json
[
  {
    "displayName": "IntelliJ IDEA Community",
    "dockerImage": "idea-rhel8",
    "productCode": "IC",
    "productVersion": [
      {
        "version": "2020.3.4",
        "downloadUrl": "https://download-cdn.jetbrains.com/idea/ideaIC-2020.3.4.tar.gz",
        "latest": true
      }
    ]
  }
]
EOT

cat << EOT >> "${TARGETDIR}"/Dockerfile

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
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Vladyslav Zhukovskyi <vzhukovs@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"
