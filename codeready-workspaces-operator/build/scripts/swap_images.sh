#!/bin/bash
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# transform references to openjdk images into their openj9 equivalents
# see also crw/che-devfile-registry/build/scripts/swap_images.sh

sed -E \
      -e 's|sso74-openshift-rhel8|sso74-openj9-openshift-rhel8|g' \
      -e 's|sso75-openshift-rhel8|sso75-openj9-openshift-rhel8|g' \
      -i ${1}
