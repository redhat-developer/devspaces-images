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
# convert che-plugin-broker upstream to crw-pluginbroker-* downstream using yq, sed, and deleting files

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/che-plugin-broker -t /tmp/crw-images/"
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
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

# global / generic changes
echo ".github/
.git/
.gitattributes
build/scripts/
container.yaml
content_sets.yml
get-source*.sh
sources
yarn.lock
/README.adoc
/make-release.sh
/RELEASE.md
.cico
.circleci
*.orig
" > /tmp/rsync-excludes

for whichbroker in metadata artifacts; do 
  echo "Rsync ${SOURCEDIR} to ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/"
  rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/
done
rm -f /tmp/rsync-excludes

# transform build/metadata/rhel.Dockerfile and build/artifacts/rhel.Dockerfile -> Dockerfile
for whichbroker in metadata artifacts; do 
	sed ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/build/${whichbroker}/rhel.Dockerfile -r \
	  `# Replace ubi8 with rhel8 version` \
	  -e "s#ubi8/go-toolset#rhel8/go-toolset#g" \
	  -e "s#FROM registry.redhat.io/#FROM #g" \
	  -e "s#FROM registry.access.redhat.com/#FROM #g" \
	> ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/Dockerfile
	cat << EOT >> ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/Dockerfile
ENV SUMMARY="Red Hat CodeReady Workspaces pluginbroker-${whichbroker} container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces pluginbroker-${whichbroker} container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="pluginbroker-${whichbroker}-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Angel Misevski <amisevsk@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
	echo "Converted pluginbroker-${whichbroker} Dockerfile"
done

# ensure shell scripts are executable
find ${TARGETDIR}/codeready-workspaces-pluginbroker-${whichbroker}/ -name "*.sh" -exec chmod +x {} \;
