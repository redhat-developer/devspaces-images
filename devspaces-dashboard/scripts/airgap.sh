#!/bin/sh
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# The script is used to download resources (projects and devfiles)
# Only https://github.com is supported for now.

set -e

init() {
  unset SRC_INDEX_JSON_PATH
  unset OUTPUT_DIR

  while [ "$#" -gt 0 ]; do
    case $1 in
      '--src-index-json-path'|'-i') SRC_INDEX_JSON_PATH=$2; shift 1;;
      '--output-dir'|'-o') OUTPUT_DIR=$2; shift 1;;
      '--help'|'-h') usage; exit;;
    esac
    shift 1
  done


  if [ -z "${SRC_INDEX_JSON_PATH}" ]; then
      usage
      exit
  fi

  if [ -z "${OUTPUT_DIR}" ]; then
    OUTPUT_DIR=$(dirname "${SRC_INDEX_JSON_PATH}")
  fi
}

usage() {
  cat <<EOF
  Usage: $0 [OPTIONS]

  Options:
    --src-index-json-path, -i   Path to the JSON file containing the list of samples
    --output-dir, -o            Directory where the downloaded resources will be stored
    --help, -h                  Show this help message
EOF
}

run() {
  mkdir -p "${OUTPUT_DIR}"
  if [ ! "${SRC_INDEX_JSON_PATH}" = "${OUTPUT_DIR}/index.json" ]; then
    cp "${SRC_INDEX_JSON_PATH}" "${OUTPUT_DIR}/index.json"
  fi

  samplesNum=$(jq -r '. | length' "${SRC_INDEX_JSON_PATH}")

  i=0
  while [ "${i}" -lt "${samplesNum}" ]; do
    url=$(jq -r '.['${i}'].url' "${SRC_INDEX_JSON_PATH}")
    sampleId=$(jq -r '.['${i}'].id' "${SRC_INDEX_JSON_PATH}")

    if [ "${url}" != "null" ]; then
      strippedURL="${url#https://github.com/}"
      organization="$(echo "${strippedURL}" | cut -d '/' -f 1)"
      repository="$(echo "${strippedURL}" | cut -d '/' -f 2)"
      ref="$(echo "${strippedURL}" | cut -d '/' -f 4)"

      if [ -n "${ref}" ]; then
        archiveFileName="${organization}-${repository}-${ref}.zip"
        devfileFileName="${organization}-${repository}-${ref}-devfile.yaml"
        projectDownloadLink="https://api.github.com/repos/${organization}/${repository}/zipball/${ref}"
        devfileDownloadLink="https://api.github.com/repos/${organization}/${repository}/contents/devfile.yaml?ref=${ref}"
      else
        archiveFileName="${organization}-${repository}.zip"
        devfileFileName="${organization}-${repository}-devfile.yaml"
        projectDownloadLink="https://api.github.com/repos/${organization}/${repository}/zipball"
        devfileDownloadLink="https://api.github.com/repos/${organization}/${repository}/contents/devfile.yaml"
      fi

      echo "[INFO] Downloading ${url} into ${archiveFileName}"
      processSample \
        "${archiveFileName}" \
        "${devfileFileName}" \
        "${projectDownloadLink}" \
        "${devfileDownloadLink}" \
        "${sampleId}" \
        "${repository}"
    fi

    i=$((i+1))
  done
}

processSample() {
  archiveFileName=$1
  devfileFileName=$2
  projectDownloadLink=$3
  devfileDownloadLink=$4
  sampleId=$5
  repository=$6

  if [ -z ${GITHUB_TOKEN} ]; then
      curl -L \
          -H "Accept: application/vnd.github.raw+json" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          "${devfileDownloadLink}" \
          -o "${OUTPUT_DIR}/${devfileFileName}"

      curl -L \
          -H "Accept: application/vnd.github+json" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          "${projectDownloadLink}" \
          -o "${OUTPUT_DIR}/${archiveFileName}"
  else
      curl -L \
          -H "Authorization: token ${GITHUB_TOKEN}" \
          -H "Accept: application/vnd.github.raw+json" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          "${devfileDownloadLink}" \
          -o "${OUTPUT_DIR}/${devfileFileName}"

      curl -L \
          -H "Authorization: token ${GITHUB_TOKEN}" \
          -H "Accept: application/vnd.github+json" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          "${projectDownloadLink}" \
          -o "${OUTPUT_DIR}/${archiveFileName}"
  fi

  # CHE_DASHBOARD_INTERNAL_URL is a placeholder that will be replaced
  # by the actual URL in entrypoint.sh
  devfileLink="CHE_DASHBOARD_INTERNAL_URL/dashboard/api/airgap-sample/devfile/download?id=${sampleId}"
  projectLink="CHE_DASHBOARD_INTERNAL_URL/dashboard/api/airgap-sample/project/download?id=${sampleId}"

  # shellcheck disable=SC2005
  echo "$(cat "${OUTPUT_DIR}/index.json" | \
    jq '(.['${i}'].url) = '\"${devfileLink}\" | \
    jq '(.['${i}'].project.zip.filename) = '\"${archiveFileName}\" | \
    jq '(.['${i}'].devfile.filename) = '\"${devfileFileName}\")" > "${OUTPUT_DIR}/index.json"

  # Update the devfile with the project link
  yq -riY '.projects=[{name: "'${repository}'", zip: {location: "'${projectLink}'"}}]' "${OUTPUT_DIR}/${devfileFileName}"
}

init "$@"
run
