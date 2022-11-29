#!/bin/bash
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
# convert che-server upstream to devspaces-server tarball downstream using sed

set -e

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 2.y

# TODO CRW-3099 compute these on the fly, rather than hardcoding

# https://orch.psi.redhat.com/pnc-web/#/projects/1274/build-configs/8937/builds/AVMJGQH423YAA
pnc_build_id="AVMJGQH423YAA"
# https://orch.psi.redhat.com/pnc-web/#/artifacts/9378447
# ==> org.eclipse.che:assembly-main:tar.gz:7.yy.0.redhat-0000z
pnc_artifact_id="9378447"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/che-server] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/che -t /tmp/ds-server"
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
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
/fetch-artifacts-pnc.yaml
get-source*.sh
tests/basic-test.yaml
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
/README.adoc
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# copy entrypoint.sh
rsync -azrlt --checksum ${SOURCEDIR}/dockerfiles/che/entrypoint.sh ${TARGETDIR}

# ensure shell scripts are executable
find ${TARGETDIR}/ -name "*.sh" -exec chmod +x {} \;

# CRW-3099 set builds.build_id and builds.build_id.artifacts.id in fetch-artifacts-pnc.yaml
pnc_build_id_url="https://orch.psi.redhat.com/pnc-web/#/projects/1274/build-configs/8937/builds/"
pnc_artifact_id_url="https://orch.psi.redhat.com/pnc-web/#/artifacts/"
sed -i ${TARGETDIR}/fetch-artifacts-pnc.yaml -r \
    -e "s@${pnc_build_id_url}.+@${pnc_build_id_url}${pnc_build_id}@" \
    -e "s@(- build_id: ).+@\1'${pnc_build_id}'@" \
    -e "s@${pnc_artifact_id_url}.+@${pnc_artifact_id_url}${pnc_artifact_id}@" \
    -e "s@(- id: ).+@\1'${pnc_artifact_id}'@" 

# NOTE: upstream Dockerfile is in non-standard path (not build/dockerfiles/Dockerfile) because project has multiple container builds
sed ${SOURCEDIR}/dockerfiles/che/Dockerfile -r \
    `# Strip registry from image references` \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
    -e 's@/home/user/eclipse-che@/home/user/devspaces@g' \
	`# insert logic to unpack asset-*.tgz` \
    -e 's@ADD eclipse-che .+@# see fetch-artifacts-pnc.yaml\nCOPY artifacts/assembly-main.tar.gz /tmp/assembly-main.tar.gz\nRUN tar xzf /tmp/assembly-main.tar.gz --strip-components=1 -C /home/user/devspaces; rm -f /tmp/assembly-main.tar.gz\n@g' \
    -e 's@chmod g\\+w /home/user/cacerts@chmod 777 /home/user/cacerts@g' \
> ${TARGETDIR}/Dockerfile
cat << EOT >> ${TARGETDIR}/Dockerfile
ENV SUMMARY="Red Hat OpenShift Dev Spaces server container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces server container" \\
    PRODNAME="devspaces" \\
    COMPNAME="server-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      pnc_artifact_id="${pnc_artifact_id}" \\
      pnc_build_id="${pnc_build_id}" \\
      license="EPLv2" \\
      maintainer="Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

# add ignore for the tarball in mid and downstream
echo "/assembly-main.tar.gz" >> ${TARGETDIR}/.gitignore
echo "Adjusted .gitignore"
