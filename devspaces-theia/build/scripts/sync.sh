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
# copy generated midstream devspaces-theia project files to devspaces-images project using sed
# see also ../../build.sh, which will generate content in this repo. 
# Use build.sh --commit to push changes into this repo before syncing to lower midsteam

set -e

COMMIT_CHANGES=0 # by default, don't commit anything that changed; optionally, use GITHUB_TOKEN to push changes to the current branch

usage () {
    echo "
Usage:   $0 -s /path/to/devspaces-theia -t /path/to/generated
Example: $0 -s ${HOME}/projects/devspaces-theia -t /tmp/devspaces-images/"
    exit
}

if [[ $# -lt 4 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 2;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 2;;
    '--commit') COMMIT_CHANGES=1; shift 1;;
    '--help'|'-h') usage;;
  esac
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi

SOURCE_SHA=$(cd "$SOURCEDIR"; git rev-parse --short=4 HEAD)

# global / generic changes
echo ".github/
.git/
.gitignore
.gitattributes
/container.yaml
/content_sets.*
/cvp.yml
tests/basic-test.yaml
sources
rhel.Dockerfile
bootstrap.Dockerfile
asset-*
" > /tmp/rsync-excludes

sync_branding_to_dsimages() {
  echo "Rsync ${SOURCEDIR}/branding to ${TARGETDIR}/devspaces-theia"
  rsync -azrlt --checksum --delete "${SOURCEDIR}/conf/theia/branding" "${TARGETDIR}/devspaces-theia"
}

sync_build_scripts_to_dsimages() {
  for targDir in theia-dev theia theia-endpoint; do
    echo "Rsync ${SOURCEDIR}/build, get-sources.sh and BUILD_* to ${TARGETDIR}/devspaces-${targDir}"
    rsync -azrlt --checksum --delete --exclude-from /tmp/rsync-excludes \
      "${SOURCEDIR}/build" "${SOURCEDIR}/BUILD_COMMAND" "${SOURCEDIR}/BUILD_PARAMS" "${SOURCEDIR}/get-sources.sh" \
      "${TARGETDIR}/devspaces-${targDir}"
  done
}

sync_dstheia_to_dsimages() {
  for targDir in theia-dev theia theia-endpoint; do
    sourceDir=${targDir};
    # TODO can we rename this in build.sh?
    if [[ ${targDir} == "theia-endpoint" ]]; then sourceDir="theia-endpoint-runtime-binary"; fi
    # TODO: should we use --delete?
    echo "Rsync ${SOURCEDIR}/dockerfiles/${sourceDir} to ${TARGETDIR}/devspaces-${targDir}"
    rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes "${SOURCEDIR}/dockerfiles/${sourceDir}" "${TARGETDIR}/devspaces-${targDir}"
    # don't need two copies of the Dockerfile, so move from subdir into root
    mv -f "${TARGETDIR}/devspaces-${targDir}/${sourceDir}/Dockerfile" "${TARGETDIR}/devspaces-${targDir}/Dockerfile"
    # ensure shell scripts are executable
    find "${TARGETDIR}/devspaces-${targDir}" -name "*.sh" -exec chmod +x {} \;
  done
}

# sync build scripts, then dockerfiles/* folders
sync_branding_to_dsimages
sync_build_scripts_to_dsimages
sync_dstheia_to_dsimages

pushd "${TARGETDIR}" >/dev/null || exit 1
  # commit changed files to this repo
  if [[ ${COMMIT_CHANGES} -eq 1 ]]; then
    git update-index --refresh || true  # ignore timestamp updates
    if [[ $(git diff-index HEAD --) ]]; then # file changed
      git add devspaces-theia*/
      echo "[INFO] Commit generated dockerfiles, lock files, and asset lists"
      git commit -s -m "chore: sync devspaces-theia @ $SOURCE_SHA to devspaces-images/devspaces-theia*/"
      git pull || true
      git push || true
    fi
  fi

popd >/dev/null || exit

# cleanup
rm -f /tmp/rsync-excludes
