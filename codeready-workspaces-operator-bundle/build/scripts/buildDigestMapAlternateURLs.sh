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
# insert RELATED_IMAGE_ fields for images referenced by the plugin and devfile registries

tmpfile=$(mktemp)

# CRW-2543 For CRW 2.13.1 disable this so we get the RHEC images instead of the in-flight OSBS images
    # | sed -r \
    # `# for plugin & devfile registries, use internal Brew versions` \
    # -e "s|registry.redhat.io/codeready-workspaces/(pluginregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-\1|g" \
    # -e "s|registry.redhat.io/codeready-workspaces/(devfileregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-\1|g" \
    # `# in all other cases (including operator) use published quay images to compute digests` \
    # -e "s|registry.redhat.io/codeready-workspaces/(.+)|quay.io/crw/\\1|g" \
echo ${image} \
    > ${tmpfile}
alt_image=$(cat ${tmpfile})
rm -f ${tmpfile}
if [[ "${alt_image}" != "${image}" ]]; then
  if [[ ! "${QUIET}" ]]; then echo "[INFO] ${0##*/} :: + Get digest for ${alt_image} (${image})"; fi
  ARCH_OVERRIDE="" # optional override so that an image without amd64 won't return a failure when searching on amd64 arch machines
  if [[ ${image} == *"-openj9"* ]]; then
    ARCH_OVERRIDE="--override-arch s390x"
  fi
  digest="$(skopeo ${ARCH_OVERRIDE} inspect --tls-verify=false docker://${alt_image} 2>/dev/null | jq -r '.Digest')"
fi
