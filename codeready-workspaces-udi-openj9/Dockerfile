# Copyright (c) 2022 Red Hat, Inc.
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

USER root

ENV \
    HOME=/home/user \
    KAMEL_VERSION="" \
    ODO_VERSION="v2.5.0" \
    NODEJS_VERSION=12 \
    GRADLE_VERSION="6.1" \
    MAVEN_VERSION="3.6.3" \
    LOMBOK_VERSION="1.18.22" \
    PYTHON_VERSION="3.8" \
    JAVA_HOME=/usr/lib/jvm/ibm-semeru-open-11-jdk \
    PATH="/usr/lib/jvm/ibm-semeru-open-11-jdk:/usr/lib/jvm/ibm-semeru-open-8-jdk:$HOME/node_modules/.bin/:$HOME/.npm-global/bin/:/opt/app-root/src/.npm-global/bin/:/opt/apache-maven/bin:/opt/gradle/bin:/usr/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/opt/apache-maven"
    PKG_CONFIG_PATH="/usr/lib64/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}" \
    GOPATH=/projects/.che/gopath \

ADD etc/storage.conf $HOME/.config/containers/storage.conf

RUN mkdir -p /home/user /projects && \

COPY . /tmp/assets/
COPY etc/docker.sh /usr/local/bin/docker
COPY lombok-${LOMBOK_VERSION}.jar /lombok.jar
COPY gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz /tmp/
COPY bin.tgz /tmp/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

# For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/ocp/tools/4.8/os/Packages/h/helm-3.6.2-5.el8.ppc64le.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202201211735.p0.g3f16530.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202201211735.p0.g3f16530.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202201211735.p0.g3f16530.assembly.stream.el8.ppc64le.rpm
# For local build: find latest rpm at https://brewweb.engineering.redhat.com/brew/packageinfo?packageID=73630
# and microdnf install yum && yum localinstall http://download.eng.bos.redhat.com/brewroot/vol/rhel-8/packages/ibm-semeru-open-8-jdk/1.8.0.302.b08_0.27.1/1.el8j9/$(uname -m)/ibm-semeru-open-8-jdk-1.8.0.302.b08_0.27.1-1.el8j9.$(uname -m).rpm

    ########################################################################
    # Common Installations and Configuration
    ########################################################################
RUN \
    microdnf install -y yum dnf bash tar gzip unzip bzip2 which shadow-utils findutils wget curl sudo git \
    openshift-clients-4.9.0-202201211735.p0.g3f16530.assembly.stream.el8 && \
    # CVE updates
    mkdir -p /opt && \
    mkdir -p ${HOME}/che && \
    mkdir -p ${HOME}/che/ls-clangd && \
    mkdir -p /projects/.che/gopath /.cache && \
    mkdir -p ${HOME}/go && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done && \
    # Generate passwd.template \
    cat /etc/passwd | \
    sed s#user:x.*#user:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template && \
    # Final updates
    dnf -y -q update && \
    ########################################################################
    # Java 8 & 11
    ########################################################################
RUN \
    dnf -y -q install ibm-semeru-open-8-jdk \
    ibm-semeru-open-11-jdk \
    nss_wrapper procps-ng && \
    # BEGIN copy from https://catalog.redhat.com/software/containers/ubi8/nodejs-12/5d3fff015a13461f5fb8635a?container-tabs=dockerfile
    dnf -y -q module reset nodejs && \
    dnf -y -q module enable nodejs:$NODEJS_VERSION && \
    INSTALL_PKGS="nodejs npm nodejs-nodemon nss_wrapper" && ln -s /usr/lib/node_modules/nodemon/bin/nodemon.js /usr/bin/nodemon && \
    dnf -y -q remove $INSTALL_PKGS && \
    dnf -y -q install --setopt=tsflags=nodocs $INSTALL_PKGS && rpm -V $INSTALL_PKGS && \
    # END copy from https://catalog.redhat.com/software/containers/ubi8/nodejs-12/5d3fff015a13461f5fb8635a?container-tabs=dockerfile
    # BEGIN update to python 3.8 per https://catalog.redhat.com/software/containers/ubi8/python-38/5dde9cacbed8bd164a0af24a?container-tabs=dockerfile
    dnf -y -q module reset python38 && \
    dnf -y -q module enable python38:${PYTHON_VERSION} && \
    dnf -y -q install python38 python38-devel python38-setuptools python38-pip && \
    # END update to python 3.8 per https://catalog.redhat.com/software/containers/ubi8/python-38/5dde9cacbed8bd164a0af24a?container-tabs=dockerfile
    # unpack gradle into /opt/gradle/
    unzip -d /opt /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    mv /opt/gradle-${GRADLE_VERSION} /opt/gradle && rm -f /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    # unpack maven \
    tar xzf /tmp/assets/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt && \
    mv /opt/apache-maven-${MAVEN_VERSION} /opt/apache-maven && \
    rm -f /tmp/assets/apache-maven-${MAVEN_VERSION}-bin.tar.gz && \
    # fix permissions in bin/* files \
    for d in $(find /opt/apache-maven -name bin -type d); do echo $d; chmod +x $d/*; done && \
    \
    # additional node stuff \
    mkdir -p /opt/app-root/src/.npm-global/bin && \
    ln -s /usr/bin/node /usr/bin/nodejs && \
    for f in "/opt/app-root/src/.npm-global"; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done
    # additional python stuff
    ln -s /usr/bin/python${PYTHON_VERSION} /usr/bin/python && \
    ln -s /usr/bin/pip${PYTHON_VERSION} /usr/bin/pip && \
    if [[ -f /tmp/assets/asset-python-ls-$(uname -m).tar.gz ]]; then \
        mkdir -p /tmp/py-unpack && \
        tar -xf /tmp/assets/asset-python-ls-$(uname -m).tar.gz -C /tmp/py-unpack && \
        for f in /tmp/py-unpack; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done; \
        cp -R /tmp/py-unpack/bin/* /usr/bin && \
        cp -R /tmp/py-unpack/lib/* /usr/lib && \
        cp -R /tmp/py-unpack/lib64/* /usr/lib64 && \
        cp -R /tmp/py-unpack/.venv "${HOME}/.venv-tmp" && \
        chgrp -R 0 "${HOME}/.venv-tmp" && chmod -R g+rwX "${HOME}/.venv-tmp" && \
        rm -fr /tmp/py-unpack \
    else \
        echo "[WARNING] Python lang server dependency tarball not found. Python support may be more limited on $(uname -m)"; \
    fi
    ########################################################################
    # Kubernetes
    ########################################################################
RUN \
    dnf -y -q install buildah npm helm-3.6.2-5.el8
    if [[ -f /usr/local/bin/kamel ]]; then rm -f /usr/local/bin/kamel; fi; \
    if [[ -f /tmp/assets/asset-kamel-$(uname -m).tar.gz ]]; then tar xzf /tmp/assets/asset-kamel-$(uname -m).tar.gz -C /usr/local/bin/; fi; \
    ########################################################################
    # Openshift
    ########################################################################
RUN \
    if [[ -f /usr/local/bin/odo ]]; then rm -f /usr/local/bin/odo; fi; \
    tar xzf /tmp/bin.tgz --strip=1 -C /usr/local/bin $(uname -m)/odo && rm -fr /tmp/bin.tgz && \
    ########################################################################
    # CPP
    ########################################################################
RUN \
    dnf -y -q llvm-toolset clang clang-libs clang-tools-extra git-clang-format gdb make cmake gcc gcc-c++ && \
    # to see what requires kernel-headers, use in line above: yum install --exclude=kernel*
    # or query: rpm -q --whatrequires kernel-headers && rpm -q --whatrequires glibc-headers && rpm -q --whatrequires glibc-devel && rpm -q --whatrequires gcc
    echo "clangd -pretty" > ${HOME}/che/ls-clangd/launch.sh && \
    chmod +x ${HOME}/che/ls-clangd/launch.sh && \
    ########################################################################
    # Golang
    #######################################################################
RUN \
    dnf -y -q install golang glibc-devel zlib-devel libstdc++ libstdc++-devel && \
    echo -e "if [ ! -d "/projects/.che/gopath/src" ]; then\necho "Copying GO LS Deps"\nmkdir -p /projects/.che/gopath\n cp -R /tmp/go/* /projects/.che/gopath\nfi" \
    > ${HOME}/gopath.sh && \
    chmod +x ${HOME}/gopath.sh
    tar -xvf /tmp/assets/asset-golang-$(uname -m).tar.gz -C /tmp && \
    for f in "/.cache" "/usr/share/gocode" "/opt/app-root/src/"; do \
        chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done && \
    ########################################################################
    # PHP
    ########################################################################
RUN \
    dnf -y -q install php php-fpm php-opcache php-devel php-pear php-gd php-mysqli php-zlib php-curl ca-certificates && \
    tar xzf /tmp/assets/asset-php-xdebug-$(uname -m).tar.gz -C / 
    dnf -y remove kernel-headers && \
    sed -i 's/opt\/app-root\/src/projects/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/#DocumentRoot/DocumentRoot/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/CustomLog \"|\/usr\/bin\/cat\"/CustomLog \"\/var\/log\/httpd\/access_log\"/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/ErrorLog \"|\/usr\/bin\/cat\"/ErrorLog \"\/var\/log\/httpd\/error_log\"/' /etc/httpd/conf/httpd.conf && \
    chmod -R 777 /var/run/httpd /var/log/httpd/ /etc/pki/ /etc/httpd/logs/
    mkdir -p ${HOME}/che/ls-php/php-language-server && \
    tar xzf /tmp/assets/asset-php-$(uname -m).tar.gz -C ${HOME}/che/ls-php/php-language-server/ && \
    cp ${HOME}/che/ls-php/php-language-server/composer/composer /usr/bin/composer && \
    ########################################################################
    # Cleanup and Summaries
    ########################################################################
RUN \
    dnf -y -q clean all --enablerepo='*' && \
    dnf -y -q clean all && rm -rf /var/cache/yum && \
    chmod 755 /usr/local/bin/*
    rm -fr /tmp/assets/ tmp/go && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    echo "========" && \
    echo -n "java:  "; java -version; \
    echo -n "mvn:   "; mvn -version; \
    echo "========" && \
    echo -n "node:  "; node --version; \
    echo -n "npm:   "; npm --version; \
    echo "========" && \
    echo -n "python:    "; python -V; \
    echo -n "pip:   "; pip -V; \
    echo -n "pylint:    "; pylint --version; \
    echo "========" && \
    echo -n "gradle:    "; gradle -v; \
    echo "========" && \
    echo -n "oc:    "; oc version; \
    echo -n "odo:    "; odo version; \
    echo -n "kubectl: "; kubectl version --short --client=true; \
    echo "========" && \
    echo -n "helm:    "; helm version --short --client; \
    if [[ -f /usr/local/bin/kamel ]]; then \
      echo -n "kamel:   "; kamel version \
    else \
      echo "kamel: not available on $(uname -m)"; \
    fi; \
    echo "========"

ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
WORKDIR /projects
CMD tail -f /dev/null

ENV SUMMARY="Red Hat CodeReady Workspaces - Universal Developer Image container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Universal Developer Image container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="udi-openj9-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.16" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
