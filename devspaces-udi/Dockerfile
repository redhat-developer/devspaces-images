# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# use rhel8/ for Brew, not ubi8/
# can pin to specific tag filter using rhel8/go-toolset#^1.17
# https://registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.18.4-8 as go-builder

USER root

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

RUN \
    ########################################################################
    # Build all Golang projects fetched from Cachito
    ########################################################################
    dnf -y -q install golang make gzip which dnf openshift-clients && \
    # BEGIN Gopls
    mkdir /home/user/go/bin -p && \
    cd $REMOTE_SOURCES_DIR/gopls/app/gopls && \
    # gopls must refer to tools as local dependency, which is located one dir above in the project
    echo 'replace golang.org/x/tools => ../' >> go.mod && \
    # build gopls application with dependencies resolved by Cachito (which are also resolved for 'tools' dependency)
    source $REMOTE_SOURCES_DIR/gopls/cachito.env && \
    GO111MODULE=on go build -o gopls && \
    ./gopls version
    # END Gopls

    # CRW-3193 disable until we have a camel-k sample again
    # BEGIN Kamel
    # cd $REMOTE_SOURCES_DIR/camelk/app && \
    # source $REMOTE_SOURCES_DIR/camelk/cachito.env && \
    # make build-kamel && \
    # ./kamel version && \
    # END Kamel

# https://registry.access.redhat.com/ubi8-minimal 
FROM ubi8-minimal:8.7-923

USER root

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

ENV \
    HOME=/home/user \
    NODEJS_VERSION="16" \
    GRADLE_VERSION="6.1" \
    MAVEN_VERSION="3.6.3" \
    PYTHON_VERSION="3.9" \
    PHP_VERSION="7.3" \
    E2FSPROGS_VERSION="1.46.5" \
    LD_LIBRARY_PATH="/usr/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}" \
    CPATH="/usr/include${CPATH:+:${CPATH}}" \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    JAVA_HOME_17=/usr/lib/jvm/java-17-openjdk \
    JAVA_HOME_11=/usr/lib/jvm/java-11-openjdk \
    JAVA_HOME_8=/usr/lib/jvm/java-1.8.0-openjdk \
    JAVA_HOME="/home/user/.java/current" \
    PATH="/home/user/.java/current/bin:/home/user/node_modules/.bin/:/home/user/.npm-global/bin/:/opt/app-root/src/.npm-global/bin/:/opt/apache-maven/bin:/opt/gradle/bin:/usr/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/opt/apache-maven" \
    PKG_CONFIG_PATH="/usr/lib64/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}"

ADD etc/storage.conf $HOME/.config/containers/storage.conf

RUN mkdir -p /projects

COPY . /tmp/assets/
COPY etc/docker.sh /usr/local/bin/docker
# see fetch-artifacts-pnc.yaml
COPY artifacts/lombok.jar /lombok.jar
COPY gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz e2fsprogs-${E2FSPROGS_VERSION}.tar.gz /tmp/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

    ########################################################################
    # Common Installations and Configuration
    ########################################################################

RUN \
    microdnf install -y dnf bash tar gzip unzip bzip2 which shadow-utils findutils wget curl sudo git procps-ng tree \
    # For OpenShift Client 4 (oc): rhocp-4.11-for-rhel-8-x86_64-rpms
    # must hard code a version because otherwise CVP/Brew fails with: Failed component comparison for components: openshift-clients
    # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.10/os/Packages/o/odo-3.2.0-2.el8.x86_64.rpm
    # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.10/os/Packages/o/odo-3.2.0-2.el8.s390x.rpm
    # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.10/os/Packages/o/odo-3.2.0-2.el8.ppc64le.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp/tools/4.10/os/Packages/h/helm-3.9.0-3.el8.x86_64.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/ocp/tools/4.10/os/Packages/h/helm-3.9.0-3.el8.s390x.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/ocp/tools/4.10/os/Packages/h/helm-3.9.0-3.el8.ppc64le.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.11/os/Packages/o/openshift-clients-4.11.0-202210262118.p0.g142cb44.assembly.stream.el8.x86_64.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.11/os/Packages/o/openshift-clients-4.11.0-202210262118.p0.g142cb44.assembly.stream.el8.s390x.rpm
    # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.11/os/Packages/o/openshift-clients-4.11.0-202210262118.p0.g142cb44.assembly.stream.el8.ppc64le.rpm
    odo-3.2.0-2.el8 helm-3.9.0-3.el8 openshift-clients-4.11.0-202210262118.p0.g142cb44.assembly.stream.el8 && \
    mkdir -p /opt && \
    # add user and configure it
    useradd -u 1000 -G wheel,root -d /home/user --shell /bin/bash -m user && \
    # Setup $PS1 for a consistent and reasonable prompt
    echo "export PS1='\W \`git branch --show-current 2>/dev/null | sed -r -e \"s@^(.+)@\(\1\) @\"\`$ '" >> "${HOME}"/.bashrc && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done && \
    # Generate passwd.template
    cat /etc/passwd | \
    sed s#user:x.*#user:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template

## Rootless podman install #1: install podman buildah skopeo
RUN dnf -y module enable container-tools:rhel8 && \ 
    dnf -y -q update --exclude=odo && \
    dnf -y reinstall shadow-utils && \
    dnf -y install podman buildah skopeo fuse-overlayfs

## Rootless podman install #2
# Set up environment variables to note that this is
# not starting with usernamespace and default to
# isolate the filesystem with chroot.
ENV _BUILDAH_STARTED_IN_USERNS="" BUILDAH_ISOLATION=chroot

## Rootless podman install #3
# Tweaks to make rootless buildah work
RUN touch /etc/subgid /etc/subuid  && \
    chmod g=u /etc/subgid /etc/subuid /etc/passwd  && \
    echo user:10000:65536 > /etc/subuid  && \
    echo user:10000:65536 > /etc/subgid

## Rootless podman install #4
# Adjust storage.conf to enable Fuse storage.
RUN sed -i -e 's|^#mount_program|mount_program|g' -e '/additionalimage.*/a "/var/lib/shared",' /etc/containers/storage.conf
RUN mkdir -p /var/lib/shared/overlay-images /var/lib/shared/overlay-layers; \
    touch /var/lib/shared/overlay-images/images.lock; \
    touch /var/lib/shared/overlay-layers/layers.lock

## Rootless podman install #5
# But use VFS since we were not able to make Fuse work yet...
RUN mkdir -p "${HOME}"/.config/containers && \
   (echo '[storage]';echo 'driver = "vfs"') > "${HOME}"/.config/containers/storage.conf

RUN \
    ########################################################################
    # Java 8 11 17
    ########################################################################
    dnf -y -q install java-1.8.0-openjdk java-1.8.0-openjdk-devel java-1.8.0-openjdk-headless \
    java-11-openjdk java-11-openjdk-devel java-11-openjdk-src java-11-openjdk-headless \
    java-17-openjdk java-17-openjdk-devel java-17-openjdk-headless && \
    mkdir -p ${HOME}/.java/current && \
    rm -f /usr/bin/java && \
    ln -s /usr/lib/jvm/java-11-openjdk/* ${HOME}/.java/current && \
    ########################################################################
    # nodejs
    ########################################################################
    # BEGIN copy from https://catalog.redhat.com/software/containers/ubi8/nodejs-16/615aee9fc739c0a4123a87e1?container-tabs=dockerfile
    dnf -y -q module enable nodejs:$NODEJS_VERSION && \
    MODULE_DEPS="make gcc gcc-c++ libatomic_ops git openssl-devel" && \
    INSTALL_PKGS="$MODULE_DEPS nodejs npm nodejs-nodemon nss_wrapper" && \
    ln -s /usr/lib/node_modules/nodemon/bin/nodemon.js /usr/bin/nodemon && \
    ln -s /usr/libexec/platform-python /usr/bin/python3 && \
    dnf -y -q install --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    # END copy from https://catalog.redhat.com/software/containers/ubi8/nodejs-16/615aee9fc739c0a4123a87e1?container-tabs=dockerfile
    ########################################################################
    # Gradle
    ########################################################################
    # unpack gradle into /opt/gradle/, and maven into /opt/apache-maven/
    mkdir -p /opt; unzip -d /opt /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    mv /opt/gradle-${GRADLE_VERSION} /opt/gradle && rm -f /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    ########################################################################
    # Maven
    ########################################################################
    tar xzf /tmp/assets/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt && \
    mv /opt/apache-maven-${MAVEN_VERSION} /opt/apache-maven && \
    rm -f /tmp/assets/apache-maven-${MAVEN_VERSION}-bin.tar.gz && \
    # fix permissions in bin/* files
    for d in $(find /opt/apache-maven -name bin -type d); do echo $d; chmod +x $d/*; done && \
    # additional node stuff
    mkdir -p /opt/app-root/src/.npm-global/bin && \
    ln -s /usr/bin/node /usr/bin/nodejs && \
    for f in "/opt/app-root/src/.npm-global"; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done && \
    ########################################################################
    # Python
    ########################################################################
    # BEGIN update to python 3.9 per https://catalog.redhat.com/software/containers/ubi8/python-39/6065b24eb92fbda3a4c65d8f?container-tabs=dockerfile
    dnf -y -q module reset python39 && \
    dnf -y -q module enable python39:${PYTHON_VERSION} && \
    dnf -y -q install python39 python39-devel python39-setuptools python39-pip jq && \
    # End update to python 3.9 per https://catalog.redhat.com/software/containers/ubi8/python-39/6065b24eb92fbda3a4c65d8f?container-tabs=dockerfile
    # python lang server
    mkdir -p /tmp/py-unpack && tar -xf /tmp/assets/asset-python-ls-$(uname -m).tar.gz -C /tmp/py-unpack && \
    for f in /tmp/py-unpack; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done; \
    for d in bin lib lib64; do cp -R /tmp/py-unpack/${d}/* /usr/${d}; done; \
    cp -R /tmp/py-unpack/.venv ${HOME} && chgrp -R 0 ${HOME}/.venv && chmod -R g+rwX ${HOME}/.venv && \
    rm -fr /tmp/py-unpack && \
    # update pip & other dependencies, that came with Cachito repository
    cd $REMOTE_SOURCES_DIR/python-deps/app/devspaces-udi/build/python && \
    source $REMOTE_SOURCES_DIR/python-deps/cachito.env && \
    # TODO CRW-3504 add yq
    python${PYTHON_VERSION} -m pip install --user --no-cache-dir --upgrade pip setuptools pytest && \
    python${PYTHON_VERSION} -m pytest -V
RUN \
    # python/pip/pylint symlinks
    echo "Create python symlinks (or display existing ones) ==>" && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pylint \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pylint && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pylint \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pylint${PYTHON_VERSION} && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pip \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pip && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pip \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pip${PYTHON_VERSION} && \
    chmod +x /usr/bin/pylint* /usr/bin/pip* && \
    SL=/usr/local/bin/python; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/python${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pip; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pip${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pylint; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pylint${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    echo "<== Create python symlinks (or display existing ones)"

# CRW-3193 disable until we have a camel-k sample again
# RUN \
#     ########################################################################
#     # Kamel
#     ########################################################################
#     if [[ -f /usr/local/bin/kamel ]]; then rm -f /usr/local/bin/kamel; fi;

# COPY --from=go-builder $REMOTE_SOURCES_DIR/camelk/app/kamel /usr/local/bin/kamel

RUN \
    ########################################################################
    # C/C++ (Tech Preview)
    ########################################################################
    dnf -y -q install llvm-toolset clang clang-libs clang-tools-extra git-clang-format gdb make cmake gcc gcc-c++ && \
    # to see what requires kernel-headers, use in line above: dnf install --exclude=kernel*
    # or query: rpm -q --whatrequires kernel-headers && rpm -q --whatrequires glibc-headers && rpm -q --whatrequires glibc-devel && rpm -q --whatrequires gcc
    mkdir -p ${HOME}/che/ls-csharp ${HOME}/che/ls-clangd && \
    echo "clangd -pretty" > ${HOME}/che/ls-clangd/launch.sh && \
    chmod +x ${HOME}/che/ls-clangd/launch.sh
RUN \
    ########################################################################
    # .NET (dotnet) 3.1 (x64 only) + 6.0 (s390x and x64 only) + 7.0 (ppc64le, s390x and x64 only) (Tech Preview)
    ########################################################################
    # TODO: dotnet 3.1 is deprecated and will hit EOL Dec 13, 2022. See https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
    # TODO: remove dotnet 3.1 from Dev Spaces 3.4 release - see https://issues.redhat.com/browse/CRW-3159
    if [[ "$(uname -m)" == 'x86_64' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-6.0 dotnet-sdk-7.0 dotnet-sdk-3.1; \
    elif [[ "$(uname -m)" == 's390x' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-6.0 dotnet-sdk-7.0; \
    elif [[ "$(uname -m)" == 'ppc64le' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-7.0; \
    fi
RUN \
    ########################################################################
    # Golang (Tech Preview)
    ########################################################################
    dnf -y -q install golang && \
    mkdir /home/user/go/bin -p
COPY --from=go-builder $REMOTE_SOURCES_DIR/gopls/app/gopls/gopls /home/user/go/bin/gopls
RUN \
    ########################################################################
    # PHP (Tech Preview) - see https://catalog.redhat.com/software/containers/ubi8/php-73/5d400891bed8bd38099104e0
    ########################################################################
    dnf -y -q module enable php:$PHP_VERSION && \
    dnf -y -q install php php-fpm php-opcache php-devel php-pear php-gd php-mysqli php-zlib php-curl ca-certificates && \
    tar xzf /tmp/assets/asset-php-xdebug-$(uname -m).tar.gz -C / && \
    sed -i 's/opt\/app-root\/src/projects/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/#DocumentRoot/DocumentRoot/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/CustomLog \"|\/usr\/bin\/cat\"/CustomLog \"\/var\/log\/httpd\/access_log\"/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/ErrorLog \"|\/usr\/bin\/cat\"/ErrorLog \"\/var\/log\/httpd\/error_log\"/' /etc/httpd/conf/httpd.conf && \
    chmod -R 777 /var/run/httpd /var/log/httpd/ /etc/pki/ /etc/httpd/logs/ && \
    mkdir -p ${HOME}/che/ls-php/php-language-server && \
    tar xzf /tmp/assets/asset-php-$(uname -m).tar.gz -C ${HOME}/che/ls-php/php-language-server/ && \
    cp ${HOME}/che/ls-php/php-language-server/composer/composer /usr/bin/composer
RUN \
    ########################################################################
    # e2fsprogs (x64 only) (Tech Preview)
    ########################################################################
    if [[ "$(uname -m)" == 'x86_64' ]]; then \
        TEMP_DIR="$(mktemp -d)" && \
        cd "${TEMP_DIR}" && \
        mv /tmp/e2fsprogs-${E2FSPROGS_VERSION}.tar.gz . && \
        tar -zxvf e2fsprogs-${E2FSPROGS_VERSION}.tar.gz && \
        cd "e2fsprogs-${E2FSPROGS_VERSION}" && \
        mkdir build && \
        cd build && \
        ../configure --prefix=/usr --with-root-prefix="" --enable-elf-shlibs && \
        make && \
        make install && \
        make install-libs && \
        cd -- && \
        rm -rf "${TEMP_DIR}"; \
    else \
        rm /tmp/e2fsprogs-${E2FSPROGS_VERSION}.tar.gz; \
    fi
    ########################################################################
    # Cleanup and Summaries
    ########################################################################
RUN \
    # fetch CVE updates (but don't update odo 2.x to 3.x)
    dnf -y -q update --exclude=odo && \
    dnf -y -q clean all --enablerepo='*' && \
    dnf -y -q clean all && rm -rf /var/cache/yum && \
    rm -fr /tmp/assets/ && \
    chmod 755 /usr/local/bin/* && \
    chmod -R g+rwX ${HOME} && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    echo "========" && \
    echo -n "Default Java Version:  "; java -version; \
    echo "========" && \
    echo -n "Java 1.8:  "; /usr/lib/jvm/java-1.8.0-openjdk/bin/java -version; \
    echo "========" && \
    echo -n "Java 11:  "; /usr/lib/jvm/java-11-openjdk/bin/java -version; \
    echo "========" && \
    echo -n "Java 17:  "; /usr/lib/jvm/java-17-openjdk/bin/java -version; \
    echo "========" && \
    echo -n "mvn:   "; mvn -version; \
    echo -n "gradle:    "; gradle -v; \
    echo "========" && \
    echo -n "node:  "; node --version; \
    echo -n "npm:   "; npm --version; \
    echo "========" && \
    echo "python basic install:"; python -V; \
    echo -n "pip:   "; pip -V; \
    echo -n "pylint:    "; pylint --version; \
    echo "========" && \
    echo "python venv install:"; source ~/.venv/bin/activate && python -V; \
    echo -n "pip:   "; pip -V; \
    echo -n "pylint:    "; pylint --version; \
    echo "========" && \
    echo -n "oc:    "; oc version; \
    echo -n "odo:    "; odo version; \
    echo -n "helm:    "; helm version --short --client; \
    echo -n "kubectl: "; kubectl version --short --client=true; \
    # CRW-3193 disable until we have a camel-k sample again
    # if [[ -f /usr/local/bin/kamel ]]; then \
    #   echo -n "kamel:   "; kamel version; \
    # else \
    #   echo "kamel: not available on $(uname -m)"; \
    # fi; \
    echo "========" && \
    echo -n "clangd:    "; clangd --version; \
    if [[ -f /usr/bin/dotnet ]]; then \
      echo -n "dotnet:    "; dotnet --info; \
    else \
      echo "dotnet: not available on $(uname -m)"; \
    fi; \
    echo -n "go:    "; go version; \
    echo -n "php:    "; php -v; \
    echo "========"

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
      version="3.4" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
