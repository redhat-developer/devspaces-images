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
FROM ubi8-minimal:8.5-218

ENV \
    KAMEL_VERSION="" \
    ODO_VERSION="v1.2.6" \
    HOME=/home/theia

ADD etc/storage.conf $HOME/.config/containers/storage.conf

RUN mkdir -p /home/theia /projects && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done

COPY bin.tgz /tmp/
COPY etc/docker.sh /usr/local/bin/docker
COPY . /tmp/assets

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

# For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.ppc64le.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.ppc64le.rpm
RUN microdnf install -y bash tar gzip which dnf openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8 && \
    dnf module reset -y nodejs && \
    dnf install -y buildah npm helm-3.6.2-5.el8 && \
    dnf -y -q update && \
    dnf -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    cat /etc/passwd | \
    sed s#theia:x.*#theia:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template && \
    if [[ -f /usr/local/bin/kamel ]]; then rm -f /usr/local/bin/kamel; fi; \
    if [[ -f /tmp/assets/asset-kamel-$(uname -m).tar.gz ]]; then tar xzf /tmp/assets/asset-kamel-$(uname -m).tar.gz -C /usr/local/bin/; fi; \
    if [[ -f /usr/local/bin/odo ]]; then rm -f /usr/local/bin/odo; fi; \
    tar xzf /tmp/bin.tgz --strip=1 -C /usr/local/bin $(uname -m)/odo && chmod 755 /usr/local/bin/* && \
    rm -fr /tmp/bin.tgz /tmp/assets && \
    echo "========" && \
    echo -n "oc:    "; oc version; \
    echo -n "odo:    "; odo version; \
    echo -n "helm:    "; helm version --short --client; \
    echo -n "kubectl: "; kubectl version --short --client=true; \
    if [[ -f /usr/local/bin/kamel ]]; then \
      echo -n "kamel:   "; kamel version \
    else \
      echo "kamel: not available on $(uname -m)"; \
    fi; \
    echo "========"

# ODO doesn't work without fixing user id
ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD tail -f /dev/null

ENV SUMMARY="Red Hat CodeReady Workspaces - Openshift plugin container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Openshift plugin container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="udi"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.15" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
