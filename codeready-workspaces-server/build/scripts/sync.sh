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
# convert che-server upstream to crw-server tarball downstream using yq, jq, sed & perl transforms, and deleting files

set -e

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/che-server] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/che -t /tmp/crw-server"
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
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# global / generic changes
echo ".github/
.git/
.gitattributes
dockerfiles/
assets/branding/
build/scripts/sync.sh
container.yaml
content_sets.yml
get-sources-jenkins.sh
tests/basic-test.yaml
sources
.ci
.dependabot
.repositories-update-contributing.sh
.repositories.yaml
/CHANGELOG.md
/CODE_OF_CONDUCT.md
/CONTRIBUTING.md
/Dockerfile
/LICENSE
/NUMBERING.md
/README.md
/RELEASE.md
/devfile.yaml
/make-release.sh
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# copy entrypoint.sh
rsync -azrlt --checksum ${SOURCEDIR}/dockerfiles/che/entrypoint.sh ${TARGETDIR}

# TODO move upstream dockefile into standard path build/dockerfiles/rhel.Dockerfile (instead of dockerfiles/che/rhel.Dockerfile) ?
sed ${SOURCEDIR}/dockerfiles/che/rhel.Dockerfile -r \
    `# Strip registry from image references` \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
    -e 's@/home/user/eclipse-che@/home/user/codeready@g' \
	`# insert logic to unpack asset-*.tgz` \
    -e 's@ADD eclipse-che .+@# NOTE: if built in Brew, use get-sources-jenkins.sh to pull latest\nCOPY asset-server.tgz /tmp/asset-server.tgz\nRUN tar xzf /tmp/asset-server.tgz --transform="s#.*eclipse-che-.*/*##" -C /home/user/codeready; rm -f /tmp/asset-server.tgz\n@g' \
    -e 's@chmod g\\+w /home/user/cacerts@chmod 777 /home/user/cacerts@g' \
> ${TARGETDIR}/Dockerfile
cat << EOT >> ${TARGETDIR}/Dockerfile
ENV SUMMARY="Red Hat CodeReady Workspaces server container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces server container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="server-rhel8"
LABEL summary="\$SUMMARY" \\
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

# add ignore for the tarball in mid and downstream
echo "/asset-server.tgz" >> ${TARGETDIR}/.gitignore
echo "Adjusted .gitignore"
