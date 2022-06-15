#!/bin/bash
# Copyright (c) 2019-2022 Red Hat, Inc.
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

nodeVersion="12.22.5" # version of node to use for theia containers (aligned to version in ubi base images)
PLATFORMS="s390x, ppc64le, x86_64"
BUILD_TYPE="tmp" # use "tmp" prefix for temporary build tags in Quay, but if we're building based on a PR, set "pr" prefix

# load defaults from file, if it exists
if [[ -r ./BUILD_PARAMS ]]; then source ./BUILD_PARAMS; fi

# try to compute a value for MIDSTM_BRANCH based on current dir
if [[ ! ${MIDSTM_BRANCH} ]]; then 
  MIDSTM_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ $MIDSTM_BRANCH != "devspaces-3."*"-rhel-8" ]] && [[ $MIDSTM_BRANCH != "devspaces-3-rhel-8" ]]; then
    MIDSTM_BRANCH="" # invalid branch, so reset
  fi
fi

if [[ ${MIDSTM_BRANCH} ]]; then usage_branch="${MIDSTM_BRANCH}"; else usage_branch="devspaces-3-rhel-8"; fi
usage () {
  echo "Run this script from the destination folder where you want asset files created, eg., where you have 
pkgs.devel devspaces-theia-dev checked out. Repeat for theia and theia-endpoint pkgs.devel repos.

Usage:
  $0 --cb MIDSTM_BRANCH --target /path/to/pkgs.devel/devspaces-theia-dev/ [options]

Examples:
  $0 --cb ${usage_branch} --target /path/to/pkgs.devel/devspaces-theia-dev/      -d --rmi:tmp --ci --commit
  $0 --cb ${usage_branch} --target /path/to/pkgs.devel/devspaces-theia/          -t --rmi:tmp --ci --commit
  $0 --cb ${usage_branch} --target /path/to/pkgs.devel/devspaces-theia-endpoint/ -e --rmi:tmp --ci --commit

Directory flags:
  --target     | instead of writing assets into current dir $(pwd)/, target a different place

Options:
  -d,--theia-dev      | if writing to a folder not named *theia-dev,      tell script to collect theia-dev assets
  -t,--theia          | if writing to a folder not named *theia,          tell script to collect theia assets
  -e,--theia-endpoint | if writing to a folder not named *theia-endpoint, tell script to collect theia-endpoint assets

Architecture flags:
  --platforms \"${PLATFORMS}\" | architectures for which to collect assets

Optional flags:
  --cb             | DS_BRANCH from which to compute version of DevSpaces to put in Dockerfiles, eg., devspaces-3.y-rhel-8 or ${MIDSTM_BRANCH}
  --cv             | rather than pull from DS_BRANCH version of redhat-developer/devspaces/dependencies/VERSION file, 
                   | just set DS_VERSION; default: ${DS_VERSION}
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
      '-d'|'--theia-dev') ARCHSTEPS="collect_arch_assets_ds_theia_dev"; NOARCHSTEPS="collect_noarch_assets_ds_theia_dev"; shift 1;;
      '-t'|'--theia') ARCHSTEPS="collect_arch_assets_ds_theia"; NOARCHSTEPS="collect_noarch_assets_ds_theia"; shift 1;;
      '-e'|'-b'|'--theia-endpoint'|'--theia-endpoint-runtime-binary') ARCHSTEPS="collect_arch_assets_ds_theia_endpoint_runtime_binary"; NOARCHSTEPS="collect_noarch_assets_ds_theia_endpoint_runtime_binary"; shift 1;;
      '--target') TARGETDIR="$2"; shift 2;;
      '--platforms') PLATFORMS="$2"; shift 2;;
      '--cb')  MIDSTM_BRANCH="$2"; shift 2;;
      '--cv')  DS_VERSION="$2"; shift 2;;
      '--nv') nodeVersion="$2"; shift 2;;
      '--pr') BUILD_TYPE="pr"; shift 1;;
      '--gh') BUILD_TYPE="gh"; shift 1;;
      '--ci') BUILD_TYPE="ci"; shift 1;; # TODO support using latest image tag 2.9-zzz-ci- or 2.9-ci-sha256sum here (see also getLatestImage.sh excludes!)
      '--rmi:tmp') DELETE_TMP_IMAGES=1; shift 1;;
      '--commit') COMMIT_CHANGES=1; shift 1;;
      '-h'|'--help') usage; shift 1;;
  esac
done

if [[ ! ${DS_VERSION} ]] && [[ ${MIDSTM_BRANCH} ]]; then
  DS_VERSION=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/dependencies/VERSION)
fi
if [[ ! ${DS_VERSION} ]]; then 
  echo "[ERROR] Must set either --cb devspaces-3.y-rhel-8 or --cv 3.y to define the version of DevSpaces Theia for which to collect assets."; echo
  usage
fi
echo "[INFO] Using MIDSTM_BRANCH = ${MIDSTM_BRANCH} and DS_VERSION = ${DS_VERSION}"
if [[ ! $ARCHSTEPS ]] || [[ ! $NOARCHSTEPS ]]; then 
  if [[ ${TARGETDIR} = *"theia-dev"* ]]; then 
    echo "[INFO] No step flag set, but TARGETDIR appears to be a theia-dev folder."
    ARCHSTEPS="collect_arch_assets_ds_theia_dev"; NOARCHSTEPS="collect_noarch_assets_ds_theia_dev";
  elif [[ ${TARGETDIR} = *"theia" ]] || [[ ${TARGETDIR} = *"theia/" ]]; then 
    echo "[INFO] No step flag set, but TARGETDIR appears to be a theia folder."
    ARCHSTEPS="collect_arch_assets_ds_theia"; NOARCHSTEPS="collect_noarch_assets_ds_theia";
  elif [[ ${TARGETDIR} = *"theia-endpoint"* ]] || [[ ${TARGETDIR} = *"theia-endpoint-runtime-binary"* ]]; then 
    echo "[INFO] No step flag set, but TARGETDIR appears to be a theia-endpoint folder."
    ARCHSTEPS="collect_arch_assets_ds_theia_endpoint_runtime_binary"; NOARCHSTEPS="collect_noarch_assets_ds_theia_endpoint_runtime_binary";
  else 
    echo "[ERROR] Nothing to do! set steps to perform with -d, -t-, -e flags."; echo
    usage
  fi
fi

# create target dir in case it doesn't already exist
mkdir -p $TARGETDIR

getContainerExtract() {
  pushd /tmp >/dev/null || exit
  if [[ ${DS_VERSION} ]] && ! [[ $(curl -sSI https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-${DS_VERSION}-rhel-8/product/containerExtract.sh | grep HTTP | grep 404 || true) ]]; then
    curl -sSLO https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-${DS_VERSION}-rhel-8/product/containerExtract.sh
  elif [[ ${MIDSTM_BRANCH} ]] && [[ ! $(curl -sSI https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/containerExtract.sh | grep HTTP | grep 404 || true) ]]; then
    curl -sSLO https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/containerExtract.sh
  else
    curl -sSLO https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/product/containerExtract.sh
  fi
  chmod +x /tmp/containerExtract.sh
  popd >/dev/null || exit
}

setImages() {
  if [[ ! $1 ]]; then UNAME="$(uname -m)"; else UNAME=$1; fi
  TMP_THEIA_DEV_BUILDER_IMAGE="quay.io/devspaces/theia-dev-rhel8:${DS_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
  TMP_THEIA_BUILDER_IMAGE="quay.io/devspaces/theia-rhel8:${DS_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
  TMP_THEIA_RUNTIME_IMAGE="quay.io/devspaces/theia-rhel8:${DS_VERSION}-${BUILD_TYPE}-runtime-${UNAME}"
  TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE="quay.io/devspaces/theia-endpoint-rhel8:${DS_VERSION}-${BUILD_TYPE}-builder-${UNAME}"
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
  thefiles="$(find "$1/" -maxdepth 1 -name "asset-*" -type f | sort -u | sed -r -e "s#^$1/*##")"
  if [[ $2 ]]; then 
    du -sch $thefiles
  else
    echo "$thefiles"
  fi
}

listWheels() {
  thefiles="$(find "$1/" -maxdepth 1 -name "*.whl" -type f | sort -u | sed -r -e "s#^$1/*##")"
  if [[ $2 ]]; then 
    du -sch $thefiles
  else
    echo "$thefiles"
  fi
}

debugData() {
  echo "[DEBUG]  == RH version + arch, hostname  + IP, user; df -h / /tmp ==>"
  echo "-- -- -- -- -- --"
  cat /etc/redhat-release
  uname -m
  echo "-- -- -- -- -- --"
  hostname -A;hostname -I
  echo "-- -- -- -- -- --"
  whoami
  echo "-- -- -- -- -- --"
  df -h / /tmp
  echo "[DEBUG] <== RH version + arch, hostname  + IP, user df -h / /tmp == "
}

user=$(whoami)
extractContainerTgz() {
  container="$1"
  filesToCollect="$2"
  # shellcheck disable=SC2086 disable=SC2116
  filesToCollect="$(echo $filesToCollect)" # squash duplicate spaces
  targetTarball="$3"
  # TODO remove this and use tar extraction rules in dockerfile instead
  subfolder="$4" # optionally, cd into a subfolder in the unpacked container before creating tarball
  doclean="$5" # optionally, clean any leftover temp folders and force re-extraction

  tmpcontainer="$(echo "$container" | tr "/:" "--")"
  if [[ $doclean == "clean" ]]; then 
    sudo rm -fr $(ls -1d "/tmp/${tmpcontainer}"* 2>/dev/null || true); 
    ${BUILDER} rmi -f $container || true
  fi
  echo "[DEBUG] Before $container extraction:"; debugData
  set -x
  unpackdir="$(ls -1d "/tmp/${tmpcontainer}"* 2>/dev/null | sort -Vr | head -1 || true)"
  if [[ ! ${unpackdir} ]]; then
    # get container and unpack into a /tmp/ folder
    time /tmp/containerExtract.sh "${container}" --tar-flags "${filesToCollect}"
  fi
  unpackdir="$(ls -1d "/tmp/${tmpcontainer}"* 2>/dev/null | sort -Vr | head -1 || true)"
  if [[ ! ${unpackdir} ]]; then
    echo "[ERROR] Problem extracting ${container} to /tmp !"
    ls -la /tmp/ | grep -E "${tmpcontainer}|${container}"
    debugData; exit 1
  else
    echo "[INFO] Collect $filesToCollect from $unpackdir into ${targetTarball} ..."
    pushd "${unpackdir}/${subfolder}" >/dev/null || exit 1
      # shellcheck disable=SC2086
      sudo tar -pzcf "${targetTarball}" ${filesToCollect#${subfolder}} --no-ignore-command-error
      if [[ $? -ne 0 ]]; then 
        echo "[ERROR] Problem packing ${targetTarball} with ${filesToCollect#${subfolder}} !"; debugData; exit 1
      fi
      sudo chown -R "${user}:${user}" "${targetTarball}"
    popd >/dev/null || exit 1
    sudo rm -fr "/tmp/${tmpcontainer}"* 2>/dev/null || true
  echo "[DEBUG] After $container extraction:"; debugData
  fi
  set +x
}

extractContainerFile() {
  container="$1"
  fileToCollect="$2"
  targetFile="$3"
  echo "[DEBUG] Before $container extraction:"; debugData
  tmpcontainer="$(echo "$container" | tr "/:" "--")"
  unpackdir="$(ls -1d "/tmp/${tmpcontainer}"* 2>/dev/null | sort -Vr | head -1 || true)"
  if [[ ! ${unpackdir} ]]; then
    # get container and unpack into a /tmp/ folder
    time /tmp/containerExtract.sh "${container}" --tar-flags "${fileToCollect}"
    unpackdir="$(ls -1d "/tmp/${tmpcontainer}"* 2>/dev/null | sort -Vr | head -1)"
  fi
  echo "[INFO] Collect $fileToCollect from $unpackdir into ${targetFile} ..."
  pushd "${unpackdir}" >/dev/null || exit 1
    cp "${fileToCollect}" "${targetFile}" && \
    sudo chown -R "${user}:${user}" "${targetFile}"
  popd >/dev/null || exit 1
  sudo rm -fr "/tmp/${tmpcontainer}"* 2>/dev/null || true
  echo "[DEBUG] After $container extraction:"; debugData
}

########################### theia-dev

collect_arch_assets_ds_theia_dev() {
  time extractContainerTgz "${TMP_THEIA_DEV_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    home/theia-dev/.yarn-global \
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-"${UNAME}".tgz "./" "clean"
  listAssets "${TARGETDIR}" du

  if [[ ${DELETE_TMP_IMAGES} -eq 1 ]]; then
    # cleanup unneeded containers from podman cache
    $BUILDER rmi -f "${TMP_THEIA_DEV_BUILDER_IMAGE}" || true
  fi
}

collect_noarch_assets_ds_theia_dev() {
  # build generator tarball
  export "$(cat BUILD_PARAMS | grep -E "^SOURCE_BRANCH")" && SOURCE_BRANCH=${SOURCE_BRANCH//\"/}
  cheTheiaSourcesDir="$(mktemp -d)"
  pushd "$cheTheiaSourcesDir" >/dev/null || exit 1
    git clone https://github.com/eclipse-che/che-theia
    cd che-theia && git checkout $SOURCE_BRANCH
    sed -i 's|Eclipse Che|Red Hat OpenShift Dev Spaces|g' ./generator/src/templates/assembly-package.mst.json
    cd generator && yarn && yarn pack --filename "${TARGETDIR}"/asset-eclipse-che-theia-generator.tgz
  popd >/dev/null || exit 1
  rm -fr "${cheTheiaSourcesDir}"

  listAssets "${TARGETDIR}" du
}

########################### theia

collect_arch_assets_ds_theia() {
  # TODO why do we have a slightly different filename here than in theia-dev assets? 
  time extractContainerTgz "${TMP_THEIA_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    home/theia-dev/.yarn-global \
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-"${UNAME}".tar.gz "./" "clean"

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
    opt/app-root/src/.npm-global" "${TARGETDIR}"/asset-yarn-runtime-image-"${UNAME}".tar.gz "./" "clean"

  listAssets "${TARGETDIR}" du
}

collect_noarch_assets_ds_theia() {
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

  if [[ ${DELETE_TMP_IMAGES} -eq 1 ]]; then
    # cleanup unneeded containers from podman cache
    $BUILDER rmi -f "${TMP_THEIA_BUILDER_IMAGE}" || true
    $BUILDER rmi -f "${TMP_THEIA_RUNTIME_IMAGE}" || true
  fi

  # create asset-branding.tar.gz from branding folder contents
  if [[ -d branding ]]; then
    tar -pcvzf "${TARGETDIR}"/asset-branding.tar.gz branding/*
  fi

  # create che-theia archive; use checked out sources to determine which yeoman plugin to collect
  export "$(cat BUILD_PARAMS | grep -E "^SOURCE_BRANCH")" && SOURCE_BRANCH=${SOURCE_BRANCH//\"/}
  cheTheiaSourcesDir="$(mktemp -d)"
  pushd "$cheTheiaSourcesDir" >/dev/null || exit 1
    git clone https://github.com/eclipse-che/che-theia
    pushd che-theia >/dev/null || exit 1 
      git checkout $SOURCE_BRANCH
      DIR="${TARGETDIR}"
      # see https://github.com/eclipse-che/che-theia/blob/7.30.x/dockerfiles/theia/build.sh#L19-L22
      git ls-files -c -o --exclude-standard | tar cf "${DIR}"/asset-che-theia.tar  -T - 
      git rev-parse --short HEAD > .git-che-theia-sha1
      tar rf ${DIR}/asset-che-theia.tar .git-che-theia-sha1
      gzip -f ${DIR}/asset-che-theia.tar

      # get the yeoman plugin using the version hardcoded in eclipse-che/che-theia/dockerfiles/theia/build.sh
      THEIA_YEOMAN_PLUGIN_URL=$(cat dockerfiles/theia/build.sh | grep THEIA_YEOMAN_PLUGIN | grep download | sed -r -e "s#.* (http.+theia).*#\1#")
      curl -sSLo ${DIR}/asset-untagged-theia_yeoman_plugin.theia ${THEIA_YEOMAN_PLUGIN_URL}
    popd >/dev/null || exit 1
  popd >/dev/null || exit 1
  rm -fr "${cheTheiaSourcesDir}"

  listAssets "${TARGETDIR}" du
}

########################### theia-endpoint

collect_arch_assets_ds_theia_endpoint_runtime_binary() {
  # npm/yarn cache
  # /usr/local/share/.cache/yarn/v*/ = yarn cache dir
  # /usr/local/share/.config/yarn/global
  # /opt/app-root/src/.npm-global = yarn symlinks
  # ${BUILDER} run --rm --entrypoint sh ${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE} -c 'ls -la \
  #   /usr/local/share/.cache/yarn/v*/ \
  #   /usr/local/share/.config/yarn/global'
  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" "\
    usr/local/share/.cache/yarn/v*/ \
    usr/local/share/.config/yarn/global" "${TARGETDIR}"/asset-theia-endpoint-runtime-binary-yarn-"${UNAME}".tar.gz "./" "clean"

  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" 'tmp/nexe-cache' "${TARGETDIR}"/asset-theia-endpoint-runtime-pre-assembly-nexe-cache-"${UNAME}".tar.gz "tmp/"
  time extractContainerTgz "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" 'tmp/nexe' "${TARGETDIR}"/asset-theia-endpoint-runtime-pre-assembly-nexe-"${UNAME}".tar.gz "tmp/"

  listAssets "${TARGETDIR}" du

  if [[ ${DELETE_TMP_IMAGES} -eq 1 ]]; then
    # cleanup unneeded containers from podman cache
    $BUILDER rmi -f "${TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE}" || true
  fi
}

collect_noarch_assets_ds_theia_endpoint_runtime_binary() {
  # node-src
  download_url="https://nodejs.org/download/release/v${nodeVersion}/node-v${nodeVersion}.tar.gz"
  echo -n "Local node version: "; node --version
  echo "Requested node version: v${nodeVersion}"
  echo "URL to curl: ${download_url}"
  curl -sSL "${download_url}" -o "${TARGETDIR}"/asset-node-src.tar.gz

  # yq wheels
  python3 -m pip download yq -d "${TARGETDIR}"/
  # exclude PyYAML source tarball & wheels (as they're single-arch and maybe not compatible w/ Brew builder)
  rm -fr "${TARGETDIR}"/PyYAML-*.tar.gz "${TARGETDIR}"/PyYAML-*.whl

  listAssets "${TARGETDIR}" du
  listWheels "${TARGETDIR}" du
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
if [[ ${DELETE_TMP_IMAGES} -eq 1 ]]; then
  echo;echo "Delete temp images from container registry"
  ${BUILDER} rmi -f $TMP_THEIA_DEV_BUILDER_IMAGE $TMP_THEIA_BUILDER_IMAGE $TMP_THEIA_RUNTIME_IMAGE $TMP_THEIA_ENDPOINT_BINARY_BUILDER_IMAGE || true
fi

if [[ $(listAssets "${TARGETDIR}") ]]; then
  echo; echo "Asset tarballs generated. See the following folder(s) for content to upload to pkgs.devel.redhat.com:"
  du -sch "${TARGETDIR}"/asset-*
  echo
fi
if [[ NOARCHSTEPS == *"collect_noarch_assets_ds_theia_endpoint_runtime_binary"* ]] && [[ $(listWheels "${TARGETDIR}") ]]; then
  echo; echo "Python wheels collected. See the following folder(s) for content to upload to pkgs.devel.redhat.com:"
  du -sch "${TARGETDIR}"/*.whl
  echo
fi

if [[ ${COMMIT_CHANGES} -eq 1 ]]; then
  newFiles="$(ls asset-* *.whl || true)"
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

    # DON'T include asset-* files, wheels, or any tarballs in git
    git rm -fr asset-* *.whl *.tar.gz *.tgz ./*.orig 2>/dev/null || true
    rm -fr asset-* *.whl *.tar.gz *.tgz ./*.orig 2>/dev/null || true
    # include any new files, ignoring files we've removed
    git add . -f --ignore-removal
    if [[ $(git commit -s -m "[get sources] ${newFiles}" . || true) == *"nothing to commit, working tree clean"* ]]; then
      echo "[INFO] No new sources committed."
    else
      git status -s -b --ignored
      echo "[INFO] Push change:"
      git pull; git push
    fi
    set +x
  popd >/dev/null || exit 1
fi
