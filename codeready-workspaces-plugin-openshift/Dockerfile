# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# This Dockerfile and folder contents are manually synced from 
# https://github.com/eclipse/che-theia/tree/v7.3.2/dockerfiles/remote-plugin-openshift-connector-0.1.0

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.4-210

ENV \
    ODO_VERSION="v1.2.6" \
    HOME=/home/theia

RUN mkdir -p /home/theia /projects && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done

COPY bin.tgz /tmp/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

# For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.ppc64le.rpm
RUN microdnf install -y bash tar gzip which dnf openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8 && \
    dnf -y -q update && \
    dnf -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    if [[ -f /usr/local/bin/odo ]]; then rm -f /usr/local/bin/odo; fi; \
    tar xzf /tmp/bin.tgz --strip=1 -C /usr/local/bin $(uname -m)/odo && rm -fr /tmp/bin.tgz && chmod 755 /usr/local/bin/* && \
    oc version && \
    odo version && \
    echo -n "kubectl: "; kubectl version --short --client=true

# ODO doesn't work without fixing user id
ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD tail -f /dev/null

ENV SUMMARY="Red Hat CodeReady Workspaces - Openshift plugin container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Openshift plugin container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="plugin-openshift-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
