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
# for air-gapped (offline) environments. Only https://github.com is supported for now.

set -e

init() {
  unset AIRGAP_RESOURCES_DIR

  while [ "$#" -gt 0 ]; do
    case $1 in
      '--airgap-resources-dir'|'-d') AIRGAP_RESOURCES_DIR=$2; shift 1;;
      '--help'|'-h') usage; exit;;
    esac
    shift 1
  done

  [ -z "${AIRGAP_RESOURCES_DIR}" ] && { usage; exit; }
  SAMPLES_JSON_PATH="${AIRGAP_RESOURCES_DIR}/index.json"
}

usage() {
  cat <<EOF
  Usage: $0 [OPTIONS]

  Options:
    --airgap-resources-dir, -d  Directory where airgap resources are stored
    --help, -h                  Show this help message
EOF
}

run() {
  samplesNum=$(jq -r '. | length' "${SAMPLES_JSON_PATH}")

  i=0
  while [ "${i}" -lt "${samplesNum}" ]; do
    url=$(jq -r '.['${i}'].url' "${SAMPLES_JSON_PATH}")
    name=$(jq -r '.['${i}'].displayName' "${SAMPLES_JSON_PATH}")
    encodedName=$(echo "${name}" | jq -Rr @uri)

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
        "${encodedName}" \
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
  encodedName=$5
  repository=$6

  curl -L \
      -H "Accept: application/vnd.github.raw+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      "${devfileDownloadLink}" \
      -o "${AIRGAP_RESOURCES_DIR}/${devfileFileName}"

  curl -L \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      "${projectDownloadLink}" \
      -o "${AIRGAP_RESOURCES_DIR}/${archiveFileName}"

  # CHE_DASHBOARD_INTERNAL_URL is a placeholder that will be replaced
  # by the actual URL in entrypoint.sh
  devfileLink="CHE_DASHBOARD_INTERNAL_URL/dashboard/api/airgap-sample/devfile/download?name=${encodedName}"
  projectLink="CHE_DASHBOARD_INTERNAL_URL/dashboard/api/airgap-sample/project/download?name=${encodedName}"

  echo "$(jq '(.['${i}'].url) = '\"${devfileLink}\" ${SAMPLES_JSON_PATH})" > "${SAMPLES_JSON_PATH}"
  echo "$(jq '(.['${i}'].project.zip.filename) = '\"${archiveFileName}\" ${SAMPLES_JSON_PATH})" > "${SAMPLES_JSON_PATH}"
  echo "$(jq '(.['${i}'].devfile.filename) = '\"${devfileFileName}\" ${SAMPLES_JSON_PATH})" > "${SAMPLES_JSON_PATH}"

  # Update the devfile with the project link
  yq -riY '.projects=[{name: "'${repository}'", zip: {location: "'${projectLink}'"}}]' "${AIRGAP_RESOURCES_DIR}/${devfileFileName}"
}

init "$@"
run
