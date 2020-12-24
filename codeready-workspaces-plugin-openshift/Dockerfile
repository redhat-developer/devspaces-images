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
FROM ubi8-minimal:8.2-349

ENV \
    ODO_VERSION="v2.0.1" \
    KUBECTL_VERSION="v1.18.10" \
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

# For OpenShift Client 4.4 (oc): rhocp-4.6-for-rhel-8-x86_64-rpms
# For OCP Tools (helm): ocp-tools-4.4-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://pulp.dist.prod.ext.phx2.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.6/os/Packages/o/openshift-clients-4.6.0-202010081244.p0.git.3794.4743d24.el8.x86_64.rpm
# http://pulp.dist.prod.ext.phx2.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.6/os/Packages/o/openshift-clients-4.6.0-202010081244.p0.git.3794.4743d24.el8.s390x.rpm
# http://pulp.dist.prod.ext.phx2.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.6/os/Packages/o/openshift-clients-4.6.0-202010081244.p0.git.3794.4743d24.el8.ppc64le.rpm
RUN microdnf install -y bash tar gzip which openshift-clients-4.6.0-202010081244.p0.git.3794.4743d24.el8 && \
    microdnf update -y systemd && microdnf clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    # NOTE: openshift-clients rpm also includes kubectl, but it's older 1.17 version, so replace that with the newer one from the tarball
    for d in odo kubectl; do if [[ -f /usr/local/bin/${d} ]]; then rm -f /usr/local/bin/${d}; fi; done && \
    tar xzf /tmp/bin.tgz --strip=1 -C /usr/local/bin $(uname -m)/odo $(uname -m)/kubectl && rm -fr /tmp/bin.tgz && chmod 755 /usr/local/bin/* && \
    \
    oc version && \
    odo version && \
    echo -n "kubectl: "; kubectl version --short --client=true

# ODO doesn't work without fixing user id
ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}

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
      version="2.6" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""

