# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/dotnet-31
FROM ubi8/dotnet-31:3.1-21

ENV SUMMARY="Red Hat CodeReady Workspaces - Dotnet Stack container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Dotnet Stack container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="stacks-dotnet-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.13" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""

ENV PATH="/usr/bin:/usr/sbin${PATH:+:${PATH}}" \
    MANPATH="/usr/share/man:${MANPATH:-}" \
    CPATH="/usr/include${CPATH:+:${CPATH}}" \
    LD_LIBRARY_PATH="/usr/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}" \
    PKG_CONFIG_PATH="/usr/lib64/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}" \
    XDG_DATA_DIRS=/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share} \
    DOTNET_RPM_VERSION=3.1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    HOME=/home/jboss

USER root

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io
# COPY content_sets*repo /etc/yum.repos.d/

# For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.ppc64le.rpm
RUN yum install -y --setopt=tsflags=nodocs wget curl openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8 dotnet dotnet-host \
    dotnet-hostfxr-${DOTNET_RPM_VERSION} dotnet-runtime-${DOTNET_RPM_VERSION} dotnet-sdk-${DOTNET_RPM_VERSION} && \
    yum remove -y nodejs && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    useradd -u 1000 -G wheel,root -d ${HOME} --shell /bin/bash -m jboss && \
    mkdir -p ${HOME}/che/ls-csharp /projects && \
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
      chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    cat /etc/passwd | \
    sed s#jboss:x.*#jboss:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template && \
    echo "jboss ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ADD entrypoint.sh ${HOME}/entrypoint.sh

USER jboss
ENTRYPOINT ["/home/jboss/entrypoint.sh"]
WORKDIR /projects
CMD tail -f /dev/null