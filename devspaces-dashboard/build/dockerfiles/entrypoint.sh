#!/bin/sh
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

echo 'Starting Dashboard backend server...'

# Update internal dashboard url
SAMPLES_DIR=/public/dashboard/devfile-registry/air-gap
find "${SAMPLES_DIR}" -type f \( -name "index.json" -o -name "*devfile.yaml" \) -exec sed -i 's|CHE_DASHBOARD_INTERNAL_URL|'${CHE_DASHBOARD_INTERNAL_URL}'|g' {} \;

# Update the related images in the devfile
RELATED_IMAGES_ENVS=$(env | grep RELATED_IMAGE_sample_encoded_ || true)
if [ -n "${RELATED_IMAGES_ENVS}" ]; then
  for RELATED_IMAGE_ENV in ${RELATED_IMAGES_ENVS}; do
    OLD_IMAGE=$(echo "${RELATED_IMAGE_ENV}" | cut -d'=' -f1 | sed 's|____|=|g' | sed 's|RELATED_IMAGE_sample_encoded_||g' | base64 -d)
    NEW_IMAGE=$(echo "${RELATED_IMAGE_ENV}" | cut -d'=' -f2)
    find "${SAMPLES_DIR}" -type f -name "*devfile.yaml" -exec sed -i 's|'"${OLD_IMAGE}"'|'"${NEW_IMAGE}"'|g' {} \;
  done
fi

start_server="node --no-deprecation /backend/server/backend.js  --publicFolder /public"
$start_server &
wait
echo 'Dashboard backend server is stopped.'
