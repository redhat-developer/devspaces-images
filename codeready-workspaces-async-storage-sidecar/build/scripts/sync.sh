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
# convert upstream che project to crw downstream project using sed

set -e

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="workspace-data-sync"
UPSTM_IMAGE="sidecar"
MIDSTM_NAME="async-storage-${UPSTM_IMAGE}"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/crw-${MIDSTM_NAME}"
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
build/scripts/sync.sh
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
get-source*.sh
tests/basic-test.yaml
sources
yarn.lock
/README.adoc
/release.sh
/common.sh
/RELEASE.md
.cico
.circleci
*.orig
" > /tmp/rsync-excludes

rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;

embed() { sed -e 's/^ *//; s/$/\\/'; }

#### MULTILINE SED---
build_image_multiline=$(embed << eof
# build go content
FROM rhel8/go-toolset:1.16.7-5 as builder
ENV GOPATH=/tmp/go/

USER root
RUN adduser appuser

COPY \$REMOTE_SOURCES \$REMOTE_SOURCES_DIR

WORKDIR \$REMOTE_SOURCES_DIR/supercronic/app

RUN source \$REMOTE_SOURCES_DIR/supercronic/cachito.env \
  && make build

WORKDIR /workspace-data-sync

COPY . .

# Make "vendoring" of github.com/gorilla/websocket dependency
RUN mkdir -p vendor/github.com/gorilla/websocket \
 && cp -rT \$REMOTE_SOURCES_DIR/websocket/app vendor/github.com/gorilla/websocket \
 && go build -mod vendor -o ./dockerfiles/sidecar/scripts/watcher ./watcher/watcher.go
eof
)

# transform build/*/Dockerfile -> Dockerfile
sed ${SOURCEDIR}/dockerfiles/${UPSTM_IMAGE}/ubi.Dockerfile -r \
  `#TODO: Remove supercronic downloading related code + simply use "useradd user"` \
  `# Remove registry so build works in Brew` \
  -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
  `# Replace go-toolset ubi8 with rhel8 version` \
  -e "s#ubi8/go-toolset#rhel8/go-toolset#g" \
  `# Provide build artifacts from build image` \
  -e '/FROM/a \
COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/scripts/watcher /watcher \
COPY --from=builder $REMOTE_SOURCES_DIR/supercronic/app/supercronic /supercronic' \
  `# Remove repos that don't work in Brew` \
  -e '/content_sets_centos8/d' \
  `# Provide scripts from builder image` \
  -e 's#COPY cron/backup-cron-job#COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/cron/backup-cron-job#g' \
  -e 's#COPY scripts#COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/s/scripts#g' \
  `# Insert builder image in the beginning` \
  -e "/# SPDX-License-Identifier: EPL-2.0/a \
   $build_image_multiline
" \
  `# Change supercronic installation` \
  -e "s|#install supercronic|\&\& chmod +x \"/supercronic\" \&\& mv \"/supercronic\" \"/usr/local/bin/supercronic\" \n \ |" \
  -e "/curl.*SUPERCRONIC_URL/,+4d" \
  `# Change user addtition` \
  -e 's|"\$USER"|\&\& useradd \$USER|' \
  -e "/groupadd/,+4d" \
> ${TARGETDIR}/Dockerfile

cat << EOT >> ${TARGETDIR}/Dockerfile
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
      maintainer="Mykhailo Kuznietsov <mkuznets@redhat.com>, Ilya Buziuk <ibuziuk@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

