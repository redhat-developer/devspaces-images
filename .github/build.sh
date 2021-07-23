#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
set -e
set -o pipefail

help() {
    echo "Usage: build.sh [options]"   
    echo "--help: display this help"
    echo "empty options: build only images with folders being changed by last commit. Can be overrided by:"
    echo "--all-images: rebuild all images"
    echo "--folders=path1,path2: rebuild only those paths"
    echo "--arch=archName: to specify the architecture"
}

# initialize global variables
init() {
  BUILD_ALL_IMAGES=false
  SPECIFIC_FOLDERS=""
  ARCH="x86_64"
}

# parse arguments
# FILTERED_ARGS are the arguments that are passed to the script minus the one being handled
parse() {
  while [ $# -gt 0 ]; do
    case $1 in
      --all-images)
        BUILD_ALL_IMAGES=true
        shift;;
      --folders=*)
        SPECIFIC_FOLDERS="${1#*=}"
        shift ;;
      --arch=*)
        ARCH="${1#*=}"
        shift ;;
      --help)
        help
        exit 0;;
      *)
      shift;;
    esac
  done
}

# grab current version (short)
# 2.14
get_current_version() {
  jq -r '.CRW_VERSION' VERSION.json
} 

# 2.14.0
get_current_version_metdata() {
  jq -r '.CSV_VERSION_METADATA' VERSION.json
} 


# get github release for the current version
# param: $1 - artifact name (like 2.14.0-configbump-assets, etc)
get_github_release() {
    local -r assetReleaseName=$1
    # need to call github API
    # https://docs.github.com/en/rest/reference/repos#get-a-release-by-tag-name
    curl -s -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/redhat-developer/codeready-workspaces-images/releases/tags/${assetReleaseName}"
}

# extract assets from a github release object
# param: content of github release JSON
extract_github_release_assets() {
    jq -n "${1}" | jq -cr '.assets[] | {name:.name, url:.browser_download_url}'
}

# Get folder names of the images to build from the current git branch
# no param
get_folder_images_to_build() {
    
    # if variables BUILD_ALL_IMAGES is true then we build all folders
    if [ "${BUILD_ALL_IMAGES}" = true ]; then
        # get all folders
        find . -type d -maxdepth 1 | grep codeready- | sed 's/^\.\///g' | sort -u
    elif [ -n "${SPECIFIC_FOLDERS}" ]; then
        # use folders that are specified
        IFS=',' read -r -a tmpFoldersArray <<< "${SPECIFIC_FOLDERS}"
        # wrap to a multi-line string
        IFS=$'\n'; echo "${tmpFoldersArray[*]}"
    else
      # need to check which folders have been updated by this commit
      # grab all modified files then, get the folder and then only report unique folders
      git diff --name-only --diff-filter=d -r HEAD HEAD^1 |  cut -d "/" -f1 | uniq
    fi
}

# Download assets for a given folder
# param: $1 is the path to the folder to build
# param: $2 is the name of the image
# param: $3 are the assets
download_build_assets() {
    local -r folder=${1}
    local -r imageName=${2}
    local -r assets=${3}
    
    echo "Downloading assets for image ${imageName}..."

    # iterate on each assets
    local filename;
    local downloadURL;
    for asset in $assets; do

        # name
        filename=$(jq -n "${asset}" | jq -r '.name')

        # file is not for this arch, skip it
        if [[ "$filename" != *"${ARCH}.tar.gz"* ]]; then
          echo "skipping ${filename} as not matching ${ARCH} arch"
          continue;
        fi

        downloadURL=$(jq -n "${asset}" | jq -r '.url')

        # check download URL is there else throw an error
        if [ -z "${downloadURL}" ]; then
            echo "Unable to find download URL for ${filename} required for image ${imageName} in folder ${folder}"    
            exit 1
        fi

        # Download the file with curl
        echo " - ${filename}..."
        curl -s -L -o "${folder}/${filename}" "${downloadURL}"
    done <<< "$(cat ./"${folder}"/sources)"
}

# Patch dockerfile content by adding registry prefix
# param: $1 is the path of the dockerfile to patch
patch_dockerfile_content() {
    local -r dockerfilePath=${1}

    # Patch Dockerfile to add redhat registry
    sed "s/FROM rhel8/FROM registry.redhat.io\/rhel8/" "${dockerfilePath}" | \
    sed "s/FROM ubi8/FROM registry.redhat.io\/ubi8/"
}

# Build the image for the given folder
# param: $1 is the path to the folder to build
# param: $2 is the name of the image
build_image() {
    local -r folder=${1}
    local -r imageName=${2}

    # the asset tag is composed of version and component name
    local -r componentName="${folder//codeready-workspaces-/}"

    local -r assetReleaseName="${currentVersion}-${componentName}-assets"

    # get content of the github release for the given asset
    echo "Fetching github metadata for ${componentName} with release ${assetReleaseName}..."
    local -r content=$(get_github_release "${assetReleaseName}")

    # Get all assets for the given release
    echo "Extracting available assets..."
    local -r assets=$(extract_github_release_assets "${content}")

    # grab assets if any
    download_build_assets "${folder}" "${imageName}" "${assets}"

    # patch dockerfile content
    patchedDockerfilePath="./${folder}/.Dockerfile"
    patch_dockerfile_content "${folder}/Dockerfile" > "${patchedDockerfilePath}"

    # build the image
    docker build -f "${patchedDockerfilePath}" -t "${imageName}" "${folder}"
}

build_images() {

  # grab the version of this repository
  local -r currentVersion="$(get_current_version_metdata)"

  # Get list of folders where we need to run the build
  echo "Computing list of folders to build..."
  local -r foldersToBuild=$(get_folder_images_to_build)
  
  if [ "${BUILD_ALL_IMAGES}" = true ]; then
    echo " => Using all-images mode"
  elif [ -n "${SPECIFIC_FOLDERS}" ]; then
    echo " => Using specific folders mode"
  else
    echo " => Using modified folders by last commit mode"
  fi

  # if foldersToBuild is empty
  if [ -z "${foldersToBuild}" ]; then
    echo " => No image to build, skipping"
    exit 0
  fi

  local -r numberOfImages=$(echo "${foldersToBuild}" | wc -l | bc)
  echo " => Found ${numberOfImages} images to build "

  echo ""
  local imageBuildCount=1
  while IFS= read -r folderToBuild ; do
    local imageName="quay.io/crw/${folderToBuild}:gh-${currentVersion}"
    echo "${imageBuildCount} - Building image ${imageName} in the folder ${folderToBuild}..."
    build_image "${folderToBuild}" "${imageName}"
    echo "Image ${imageName} successfully built."
  
    # increment the counter
    imageBuildCount=$((imageBuildCount+1))

  done <<< "${foldersToBuild}"
}

# initialize
init

# analyze args
parse "$@"

# see usage() function for details
build_images
