#!/bin/bash
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# transform references to openjdk images into their openj9 equivalents
# see also crw/che-devfile-registry/build/scripts/swap_images.sh

sed -E \
      `# TODO: do we still need these two transforms?` \
      `#-e 's|(.*image: *"?).*jboss-eap-7-eap-xp1-openjdk11-openshift-rhel8[^"]*("?)|\1registry-proxy.engineering.redhat.com/rh-osbs/jboss-eap-7-eap73-openj9-11-openshift-rhel8:7.3.0\2|g'` \
      `#-e 's|(.*image: *"?).*jboss-eap-7-eap-xp1-openjdk8-openshift-rhel7:1.0[^"]*("?)|\1registry-proxy.engineering.redhat.com/rh-osbs/jboss-eap-7-eap73-openj9-11-openshift-rhel8:7.3.0\2|g'` \
      -e 's|sso75-openshift-rhel8|sso75-openj9-openshift-rhel8|g' \
      -i ${1}
