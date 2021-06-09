#!/bin/bash
# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# script to collect assets from theia-dev, theia, and theia-endpoint builder + runtime container images
# create tarballs & other files from those containers, which can then be committed to pkgs.devel repo

nodeVersion="12.21.0" # version of node to use for theia containers (aligned to version in ubi base images)
PLATFORMS="s390x, ppc64le, x86_64"
BUILD_TYPE="tmp" # use "tmp" prefix for temporary build tags in Quay, but if we're building based on a PR, set "pr" prefix

# load defaults from file, if it exists
if [[ -r ./BUILD_PARAMS ]]; then source ./BUILD_PARAMS; fi

usage () {
  echo "Run this script from the destination folder where you want asset files created, eg., where you have 
pkgs.devel codeready-workspaces-theia-dev checked out. Repeat for theia and theia-endpoint pkgs.devel repos.

Usage:
  $0 --cb MIDSTM_BRANCH --target /path/to/pkgs.devel/crw-theia-dev/ [options]

Examples:
  $0 --cb crw-2-rhel-8 --target /path/to/pkgs.devel/crw-theia-dev/      -d --rmi:tmp --ci --commit
  $0 --cb crw-2-rhel-8 --target /path/to/pkgs.devel/crw-theia/          -t --rmi:tmp --ci --commit
  $0 --cb crw-2-rhel-8 --target /path/to/pkgs.devel/crw-theia-endpoint/ -e --rmi:tmp --ci --commit

Options:
  -d           | collect assets for theia-dev
  -t           | collect assets for theia
  -e           | collect assets for theia-endpoint

Directory flags:
  --target     | instead of writing assets into current dir $(pwd)/, target a different place

Architecture flags:
  --platforms \"${PLATFORMS}\" | architectures for which to collect assets

Optional flags:
  --cb             | CRW_BRANCH from which to compute version of CRW to put in Dockerfiles, eg., crw-2.y-rhel-8 or ${MIDSTM_BRANCH}
  --cv             | rather than pull from CRW_BRANCH version of redhat-developer/codeready-workspaces/dependencies/VERSION file, 
                   | just set CRW_VERSION; default: ${CRW_VERSION}
  --nv             | node version to use; default: ${nodeVersion}
  --pr             | if building based on a GH pull request, use 'pr' in tag names instead of 'tmp'
  --gh             | if building in GH action, use 'gh' in tag names instead of 'tmp'
  --ci             | if building in Jenkins, use 'ci' in tag names instead of 'tmp'
  --rmi:tmp        | delete temp images when done
  --commit         | if the target folder is a dist-git project, commit sources and sources file. Requires rhpkg
"
  exit
}
if [[ $# -lt 1 ]]; then usage; fi

TARGETDIR="$(pwd)/"
ARCHSTEPS=""
NOARCHSTEPS=""
DELETE_TMP_IMAGES=0
COMMIT_CHANGES=0

for key in "$@"; do
  case $key in 
      '-d') ARCHSTEPS="collect_arch_assets_crw_theia_dev"; NOARCHSTEPS="collect_noarch_assets_crw_theia_dev"; shift 1;;
      '-t') ARCHSTEPS="collect_arch_assets_crw_theia"; NOARCHSTEPS="collect_noarch_assets_crw_theia"; shift 1;;
      '-e'|'-b') ARCHSTEPS="collect_arch_assets_crw_theia_endpoint_runtime_binary"; NOARCHSTEPS="collect_noarch_assets_crw_theia_endpoint_runtime_binary"; shift 1;;
      '--target') TARGETDIR="$2"; shift 2;;
      '--platforms') PLATFORMS="$2"; shift 2;;
      '--cb')  MIDSTM_BRANCH="$2"; shift 2;;
      '--cv')  CRW_VERSION="$2"; shift 2;;
      '--nv') nodeVersion="$2"; shift 2;;
      '--pr') BUILD_TYPE="pr"; shift 1;;
      '--gh') BUILD_TYPE="gh"; shift 1;;
      '--ci') BUILD_TYPE="ci"; shift 1;; # TODO support using latest image tag 2.9-zzz-ci- or 2.9-ci-sha256sum here (see also getLatestImage.sh excludes!)
      '--rmi:tmp') DELETE_TMP_IMAGES=1; shift 1;;
      '--commit') COMMIT_CHANGES=1; shift 1;;
      '-h'|'--help') usage; shift 1;;
  esac
done

if [[ ! ${CRW_VERSION} ]] && [[ ${MIDSTM_BRANCH} ]]; then
  CRW_VERSION=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION)
fi
if [[ ! ${CRW_VERSION} ]]; then 
  echo "[ERROR] Must set either --cb crw-2.y-rhel-8 or --cv 2.y to define the version of CRW Theia for which to collect assets."; echo
  usage
fi
if [[ ! $ARCHSTEPS ]] || [[ ! $NOARCHSTEPS ]]; then 
  echo "[ERROR] Nothing to do! set steps to perform with -d, -t-, -e flags."; echo
  usage
fi

getContainerExtract() {
  pushd /tmp >/dev/null || exit
  if [[ ${MIDSTM_BRANCH} ]]; then 
    curl -sSLO https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/containerExtract.sh
  else
    # try to get the CRW_VERSION of the script
    if [[ ${CRW_VERSION} ]] && [[ $(curl -sSI https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-${CRW_VERSION}-rhel-8/product/containerExtract.sh | grep 404 || true) ]]; then
      curl -sSLO https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/product/containerExtract.sh
    else
      curl -sSLO https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-${CRW_VERSION}-rhel-8/product/containerExtract.sh
    fi
  fi
  chmod +x /tmp/containerExtract.sh
  popd >/dev/null || exit
}

setImages() {
  if [[ ! $1 ]]; then UNAME="$(uname -m)"; else UNAME=$1; fi
  TMP_THEIA_DEV_BUILDER_IMAGE="quay.io/crw/theia-dev-rhel8:${CRW_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
  TMP_THEIA_BUILDER_IMAGE="quay.io/crw/theia-rhel8:${CRW_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
  TMP_THEIA_RUNTIME_IMAGE="quay.io/crw/theia-rhel8:${CRW_VERSION}-${BUILD_TYPE}-runtime-${UNAME}"
  TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE="quay.io/crw/theia-endpoint-rhel8:${CRW_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
}

BUILDER=$(command -v podman || true)
if [[ ! -x $BUILDER ]]; then
  # echo "[WARNING] podman is not installed, trying with docker"
  BUILDER=$(command -v docker || true)
  if [[ ! -x $BUILDER ]]; then
    echo "[ERROR] Neither podman nor docker is installed. Install it to continue."
    exit 1
  fi
fi

listAssets() {
  find "$1/" -maxdepth 1 -name "asset*" -type f | sort -u | sed -r -e "s#^$1/*##"
}

user=$(whoami)
extractContainerTgz() {
  container="$1"
  filesToCollect="$2"
  targetTarball="$3"
  # TODO remove this and use tar extraction rules in dockerfile instead
  subfolder="$4" # optionally, cd into a subfolder in the unpacked container before creating tarball

  tmpcontainer="$(echo $container | tr "/:" "--")"
  unpackdir="$(find /tmp -name "${tmpcontainer}-*" -type d 2>/dev/null | sort -Vr | head -1 || true)"
  if [[ ! ${unpackdir} ]]; then
    # get container and unpack into a /tmp/ folder
    time /tmp/containerExtract.sh "${container}" --tar-flags "${filesToCollect}"
    unpackdir="$(find /tmp -name "${tmpcontainer}-*" -type d 2>/dev/null | sort -Vr | head -1)"
  fi
  echo "[INFO] Collect $filesToCollect from $unpackdir into ${targetTarball} ..."
  pushd "${unpackdir}/${subfolder}" >/dev/null || exit 1
    # shellcheck disable=SC2086
    sudo tar -pzcf "${targetTarball}" ${filesToCollect#${subfolder}} && \
    sudo chown -R "${user}:${user}" "${targetTarball}"
  popd >/dev/null || exit 1
  sudo rm -fr "${unpackdir}"
}

extractContainerFile() {
  container="$1"
  fileToCollect="$2"
  targetFile="$3"

  tmpcontainer="$(echo $container | tr "/:" "--")"
  unpackdir="$(find /tmp -name "${tmpcontainer}-*" -type d 2>/dev/null | sort -Vr | head -1 || true)"
  if [[ ! ${unpackdir} ]]; then
    # get container and unpack into a /tmp/ folder
    time /tmp/containerExtract.sh "${container}" --tar-flags "${fileToCollect}"
    unpackdir="$(find /tmp -name "${tmpcontainer}-*" -type d 2>/dev/null | sort -Vr | head -1)"
  fi
  echo "[INFO] Collect $fileToCollect from $unpackdir into ${targetFile} ..."
  pushd "${unpackdir}" >/dev/null || exit 1
    cp "${fileToCollect}" "${targetFile}" && \
    sudo chown -R "${user}:${user}" "${targetFile}"
  popd >/dev/null || exit 1
  sudo rm -fr "${unpackdir}"
}

########################### theia-dev

collect_arch_assets_crw_theia_dev() {
  time extractContainerTgz "${TMP_THEIA_DEV_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    home/theia-dev/.yarn-global \
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-"${UNAME}".tgz
  listAssets "${TARGETDIR}"
}

collect_noarch_assets_crw_theia_dev() {
  # build generator tarball
  export "$(cat BUILD_PARAMS | grep -E "^SOURCE_BRANCH")" && SOURCE_BRANCH=${SOURCE_BRANCH//\"/}
  cheTheiaSourcesDir="$(mktemp -d)"
  pushd "$cheTheiaSourcesDir" >/dev/null || exit 1
    git clone https://github.com/eclipse-che/che-theia
    cd che-theia && git checkout $SOURCE_BRANCH
    cd generator && yarn && yarn pack --filename "${TARGETDIR}"/asset-eclipse-che-theia-generator.tgz
  popd >/dev/null || exit 1
  rm -fr "${cheTheiaSourcesDir}"

  listAssets "${TARGETDIR}"
}

########################### theia

collect_arch_assets_crw_theia() {
  # TODO why do we have a slightly different filename here than in theia-dev assets? 
  time extractContainerTgz "${TMP_THEIA_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    home/theia-dev/.yarn-global \
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-"${UNAME}".tar.gz

  # post-install dependencies
  # /home/theia-dev/theia-source-code/packages/debug-nodejs/download = node debug vscode binary
  # /home/theia-dev/theia-source-code/plugins/ = VS Code extensions
  # /tmp/vscode-ripgrep-cache-1.2.4 /tmp/vscode-ripgrep-cache-1.5.7 = rigrep binaries
  # /home/theia-dev/.cache = include electron/node-gyp cache
  # ${BUILDER} run --rm --entrypoint sh ${TMP_THEIA_BUILDER_IMAGE} -c 'ls -la \
  #   /home/theia-dev/theia-source-code/dev-packages \
  #   /home/theia-dev/theia-source-code/packages \
  #   /home/theia-dev/theia-source-code/plugins \
  #   /tmp/vscode-ripgrep-cache* \
  #   /home/theia-dev/.cache'
  time extractContainerTgz "${TMP_THEIA_BUILDER_IMAGE}" "\
    home/theia-dev/theia-source-code/dev-packages \
    home/theia-dev/theia-source-code/packages \
    home/theia-dev/theia-source-code/plugins \
    tmp/vscode-ripgrep-cache-* \
    home/theia-dev/.cache" "${TARGETDIR}"/asset-post-download-dependencies-"${UNAME}".tar.gz

  # Add yarn.lock after compilation
  time extractContainerFile "${TMP_THEIA_BUILDER_IMAGE}" "home/theia-dev/theia-source-code/yarn.lock" "${TARGETDIR}"/asset-yarn-"${UNAME}".lock

  # npm/yarn cache
  # /usr/local/share/.cache/yarn/v*/ = yarn cache dir
  # /opt/app-root/src/.npm-global = npm global
  # ${BUILDER} run --rm --entrypoint sh ${TMP_THEIA_RUNTIME_IMAGE} -c 'ls -la \
  #   /usr/local/share/.cache/yarn/v*/ \
  #   /opt/app-root/src/.npm-global'
  time extractContainerTgz "${TMP_THEIA_RUNTIME_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-runtime-image-"${UNAME}".tar.gz

  listAssets "${TARGETDIR}"
}

collect_noarch_assets_crw_theia() {
  # node-headers
  download_url="https://nodejs.org/download/release/v${nodeVersion}/node-v${nodeVersion}-headers.tar.gz"
  echo -n "Local node version: "; node --version
  echo "Requested node version: v${nodeVersion}"
  echo "URL to curl: ${download_url}"
  curl -sSL "${download_url}" -o "${TARGETDIR}"/asset-node-headers.tar.gz

  # Theia source code
  time extractContainerFile ${TMP_THEIA_BUILDER_IMAGE} "home/theia-dev/theia-source-code.tgz" "${TARGETDIR}"/asset-theia-source-code.tar.gz

  # Save sshpass sources
  time extractContainerFile "${TMP_THEIA_RUNTIME_IMAGE}" opt/app-root/src/sshpass.tar.gz "${TARGETDIR}"/asset-sshpass-sources.tar.gz

  # create asset-branding.tar.gz from branding folder contents
  if [[ -d branding ]]; then
    tar -pcvzf "${TARGETDIR}"/asset-branding.tar.gz branding/*
  fi

  # build sources tarball
  export "$(cat BUILD_PARAMS | grep -E "^SOURCE_BRANCH")" && SOURCE_BRANCH=${SOURCE_BRANCH//\"/}
  cheTheiaSourcesDir="$(mktemp -d)"
  pushd "$cheTheiaSourcesDir" >/dev/null || exit 1
    git clone https://github.com/eclipse-che/che-theia
    cd che-theia && git checkout $SOURCE_BRANCH
    git ls-files -c -o --exclude-standard | tar czf "${TARGETDIR}"/asset-eclipse-che-theia-generator.tgz  -T - 
  popd >/dev/null || exit 1
  rm -fr "${cheTheiaSourcesDir}"

  listAssets "${TARGETDIR}"
}

########################### theia-endpoint

collect_arch_assets_crw_theia_endpoint_runtime_binary() {
  # npm/yarn cache
  # /usr/local/share/.cache/yarn/v*/ = yarn cache dir
  # /usr/local/share/.config/yarn/global
  # /opt/app-root/src/.npm-global = yarn symlinks
  # ${BUILDER} run --rm --entrypoint sh ${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE} -c 'ls -la \
  #   /usr/local/share/.cache/yarn/v*/ \
  #   /usr/local/share/.config/yarn/global'
  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    usr/local/share/.config/yarn/global" "${TARGETDIR}"/asset-theia-endpoint-runtime-binary-yarn-"${UNAME}".tar.gz

  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" 'tmp/nexe-cache' "${TARGETDIR}"/asset-theia-endpoint-runtime-pre-assembly-nexe-cache-"${UNAME}".tar.gz "tmp/"
  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" 'tmp/nexe' "${TARGETDIR}"/asset-theia-endpoint-runtime-pre-assembly-nexe-"${UNAME}".tar.gz "tmp/"

  listAssets "${TARGETDIR}"
}

collect_noarch_assets_crw_theia_endpoint_runtime_binary() {
  # node-src
  download_url="https://nodejs.org/download/release/v${nodeVersion}/node-v${nodeVersion}.tar.gz"
  echo -n "Local node version: "; node --version
  echo "Requested node version: v${nodeVersion}"
  echo "URL to curl: ${download_url}"
  curl -sSL "${download_url}" -o "${TARGETDIR}"/asset-node-src.tar.gz

  listAssets "${TARGETDIR}"
}

getContainerExtract
for platform in $PLATFORMS; do
  platform=${platform//,/} # trim commas
  setImages $platform
  for step in $ARCHSTEPS; do
    echo 
    echo "=========================================================="
    echo "====== $step $platform"
    echo "=========================================================="
    $step 
  done
done
for step in $NOARCHSTEPS; do
  echo 
  echo "=========================================================="
  echo "====== $step no arch"
  echo "=========================================================="
  $step 
done

# optional cleanup of generated images
if [[ ${DELETE_TMP_IMAGES} -eq 1 ]] || [[ ${DELETE_ALL_IMAGES} -eq 1 ]]; then
  echo;echo "Delete temp images from container registry"
  ${BUILDER} rmi -f $TMP_THEIA_DEV_BUILDER_IMAGE $TMP_THEIA_BUILDER_IMAGE $TMP_THEIA_RUNTIME_IMAGE $TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE || true
fi

echo; echo "Asset tarballs generated. See the following folder(s) for content to upload to pkgs.devel.redhat.com:"
du -sch "${TARGETDIR}"/asset*
echo

if [[ ${COMMIT_CHANGES} -eq 1 ]]; then
  newFiles="$(ls asset-*)"
  pushd "${TARGETDIR}" >/dev/null || exit 1
    set -x 
    echo "[INFO] Upload new sources: ${newFiles}"
    for nf in ${newFiles}; do
      # make sure asset files are not tracked by git so we can push 'em to lookaside cache
      git rm --cached $nf || true
    done
    if [[ $(git remote -v | grep origin | grep pkgs.devel || true) ]]; then
    # shellcheck disable=SC2046
      rhpkg new-sources ${newFiles}
    fi

    maxfilesize=$(du -b asset-* | sed -r -e "s#\t.+##" | sort -Vr | head -1)
    # include any new files...
    git add . -A -f
    # but DON'T include asset-* files in git
    git rm -fr asset-* ./*.orig 2>/dev/null || true 
    # CRW-1621 if any gz resources are larger than 10485760b, must use MaxFileSize to force dist-git to shut up and take my sources!
    if [[ $(git commit -a -s -m "[get sources] ${newFiles}
      - MaxFileSize: $maxfilesize
  ". || true) == *"nothing to commit, working tree clean"* ]]; then
      echo "[INFO] No new sources committed."
    else
      git status -s -b --ignored
      echo "[INFO] Push change:"
      git pull; git push
    fi
    set +x
  popd >/dev/null || exit 1
fi
