# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal

FROM ubi8-minimal:8.6-751

USER root

ENV \
    HOME=/home/user \
    KAMEL_VERSION="" \
    ODO_VERSION="v2.5.0" \
    NODEJS_VERSION="16" \
    GRADLE_VERSION="6.1" \
    MAVEN_VERSION="3.6.3" \
    LOMBOK_VERSION="1.18.22" \
    PYTHON_VERSION="3.8" \
    PHP_VERSION="7.3" \
    E2FSPROGS_VERSION="1.46.5" \
    LD_LIBRARY_PATH="/usr/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}" \
    CPATH="/usr/include${CPATH:+:${CPATH}}" \
    DOTNET_RPM_VERSION=3.1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    JAVA11_HOME=/usr/lib/jvm/java-11-openjdk \
    JAVA8_HOME=/usr/lib/jvm/java-1.8.0-openjdk \
    JAVA_HOME="/home/user/.java/current" \
    PATH="/home/user/.java/current/bin:/home/user/node_modules/.bin/:/home/user/.npm-global/bin/:/opt/app-root/src/.npm-global/bin/:/opt/apache-maven/bin:/opt/gradle/bin:/usr/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/opt/apache-maven" \
    PKG_CONFIG_PATH="/usr/lib64/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}" \
    GOPATH=/projects/.che/gopath

ADD etc/storage.conf $HOME/.config/containers/storage.conf

RUN mkdir -p /home/user /projects

COPY . /tmp/assets/
COPY etc/docker.sh /usr/local/bin/docker
COPY lombok-${LOMBOK_VERSION}.jar /lombok.jar
COPY gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz e2fsprogs-${E2FSPROGS_VERSION}.tar.gz /tmp/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

    ########################################################################
    # Common Installations and Configuration
    ########################################################################
RUN \
    microdnf install -y dnf bash tar gzip unzip bzip2 which shadow-utils findutils wget curl sudo git procps-ng podman skopeo \
    # For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
    # must hard code a version because otherwise CVP/Brew fails with: Failed component comparison for components: openshift-clients
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.x86_64.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.s390x.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.ppc64le.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202204132236.p0.g9148981.assembly.stream.el8.x86_64.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202204132236.p0.g9148981.assembly.stream.el8.s390x.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202204132236.p0.g9148981.assembly.stream.el8.ppc64le.rpm
    buildah helm-3.6.2-5.el8 openshift-clients-4.9.0-202204132236.p0.g9148981.assembly.stream.el8 && \
    mkdir -p /opt && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done && \
    # add user and configure it
    useradd -u 1000 -G wheel,root -d /home/user --shell /bin/bash -m user && \
    # Generate passwd.template
    cat /etc/passwd | \
    sed s#user:x.*#user:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template
RUN \
    ########################################################################
    # Python
    ########################################################################
    # BEGIN update to python 3.8 per https://catalog.redhat.com/software/containers/ubi8/python-38/5dde9cacbed8bd164a0af24a?container-tabs=dockerfile
    dnf -y -q module reset python38 && \
    dnf -y -q module enable python38:${PYTHON_VERSION} && \
    dnf -y -q install python38 python38-devel python38-setuptools python38-pip && \
    # END update to python 3.8 per https://catalog.redhat.com/software/containers/ubi8/python-38/5dde9cacbed8bd164a0af24a?container-tabs=dockerfile
    # python lang server
    cp -rT $REMOTE_SOURCES_DIR/python-ls/app /tmp/py-unpack2 && ls /tmp-py-unpack2 && \
    mkdir -p /tmp/py-unpack && tar -xf /tmp/assets/asset-python-ls-$(uname -m).tar.gz -C /tmp/py-unpack && \   
    for f in /tmp/py-unpack; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done; \
    for d in bin lib lib64; do cp -R /tmp/py-unpack/${d}/* /usr/${d}; done; \
    cp -R /tmp/py-unpack/.venv ${HOME} && chgrp -R 0 ${HOME}/.venv && chmod -R g+rwX ${HOME}/.venv && \
    rm -fr /tmp/py-unpack
RUN \
    # python/pip/pylint symlinks
    echo "Create python symlinks (or display existing ones) ==>" && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pylint \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pylint && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pylint \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pylint${PYTHON_VERSION} && \
    chmod +x /usr/bin/pylint* && \
    SL=/usr/local/bin/python; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/python${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pip; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pip${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pylint; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pylint${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    echo "<== Create python symlinks (or display existing ones)"
ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
WORKDIR /projects
CMD tail -f /dev/null

ENV SUMMARY="Red Hat OpenShift Dev Spaces - Universal Developer Image container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces - Universal Developer Image container" \
    PRODNAME="devspaces" \
    COMPNAME="udi-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.1" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
