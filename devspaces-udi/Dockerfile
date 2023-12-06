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
FROM rhel8/go-toolset:1.20.10-3 as go-builder

USER root

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

RUN \
    ########################################################################
    # Build all Golang projects fetched from Cachito
    ########################################################################
    dnf -y -q install golang make gzip which openshift-clients && \
    # BEGIN Gopls
    mkdir /home/tooling/go/bin -p && \
    cd $REMOTE_SOURCES_DIR/gopls/app/gopls && \
    # gopls must refer to tools as local dependency, which is located one dir above in the project
    echo 'replace golang.org/x/tools => ../' >> go.mod && \
    # build gopls application with dependencies resolved by Cachito (which are also resolved for 'tools' dependency)
    source $REMOTE_SOURCES_DIR/gopls/cachito.env && \
    GO111MODULE=on go build -o gopls && \
    ./gopls version && \
    # END Gopls

    # BEGIN Kubedock
    cd $REMOTE_SOURCES_DIR/kubedock/app && \
    # build kubedock application with dependencies resolved by Cachito
    source $REMOTE_SOURCES_DIR/kubedock/cachito.env && \
    LDFLAGS="-X github.com/joyrex2001/kubedock/internal/config.Date=`date -u +%Y%m%d-%H%M%S`  \
     -X github.com/joyrex2001/kubedock/internal/config.Build=9d21955b52e4905d916d24e724dcad195aef3515   \
     -X github.com/joyrex2001/kubedock/internal/config.Version=0.11.0  \
     -X github.com/joyrex2001/kubedock/internal/config.Image=joyrex2001/kubedock:0.11.0" && \
    CGO_ENABLED=0 go build -ldflags "${LDFLAGS}" -o kubedock && \
    chmod +x ./kubedock && \
    ./kubedock version && \
    # END Kubedock

    # CRW-3193 disable until we have a camel-k sample again
    # BEGIN Kamel
    # cd $REMOTE_SOURCES_DIR/camelk/app && \
    # source $REMOTE_SOURCES_DIR/camelk/cachito.env && \
    # make build-kamel && \
    # ./kamel version && \
    # END Kamel

    # BEGIN stow
    dnf -y -q install perl texinfo texinfo-tex git && \
    cd $REMOTE_SOURCES_DIR/stow/app && \
    mkdir -p $REMOTE_SOURCES_DIR/stow/app/build && \
    autoreconf -iv && \
    ./configure --prefix=$REMOTE_SOURCES_DIR/stow/app/build && \
    make install && \
    cd $REMOTE_SOURCES_DIR/stow/app/build/bin/ && \
    ./stow --version
    # END stow

# https://registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.9-1029

USER root

ENV \
    # We install everything to /home/tooling/ as /home/user/ may get overwritten, see github.com/eclipse/che/issues/22412
    HOME=/home/tooling \
    NODEJS_VERSION="18" \
    PYTHON_VERSION="3.11" \
    PHP_VERSION="7.4" \
    XDEBUG_VERSION="3.1.6" \
    LD_LIBRARY_PATH="/usr/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}" \
    CPATH="/usr/include${CPATH:+:${CPATH}}" \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    JAVA_HOME_17=/usr/lib/jvm/java-17-openjdk \
    JAVA_HOME_11=/usr/lib/jvm/java-11-openjdk \
    JAVA_HOME_8=/usr/lib/jvm/java-1.8.0-openjdk \
    JAVA_HOME="/home/user/.java/current" \
    GOBIN="/home/user/go/bin/" \
    # We have $PATH entries in /home/tooling/ (in addition to /home/user/) to ensure binaries can be found in case /home/user/ has been ovewritten and stow has not yet run in the entrypoint
    PATH="/home/user/.local/bin:/home/user/.java/current/bin:/home/user/node_modules/.bin/:/home/user/.npm-global/bin/:/opt/app-root/src/.npm-global/bin/:/usr/share/maven/bin:/usr/bin:/home/user/go/bin::/home/tooling/.local/bin:/home/tooling/.java/current/bin:/home/tooling/node_modules/.bin/:/home/tooling/.npm-global/bin/:/home/tooling/go/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/usr/share/maven" \
    PKG_CONFIG_PATH="/usr/lib64/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}" \
    KUBECONFIG=/home/user/.kube/config \
    PROFILE_EXT=/etc/profile.d/udi_environment.sh \
    # Rootless podman install #1:
    # Set up environment variables to note that this is
    # not starting with usernamespace and default to
    # isolate the filesystem with chroot.
    _BUILDAH_STARTED_IN_USERNS="" BUILDAH_ISOLATION=chroot \
    SUMMARY="Red Hat OpenShift Dev Spaces - Universal Developer Image container" \
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
      version="3.12" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""

RUN mkdir -p /home/tooling/
ADD etc/storage.conf $HOME/.config/containers/storage.conf
ADD etc/entrypoint.sh /entrypoint.sh
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
COPY --chown=0:0 etc/podman-wrapper.sh /usr/bin/
RUN mkdir -p /home/tooling/
COPY --chown=0:0 etc/.stow-local-ignore /home/tooling/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 8 content sets (from Brew) to resolve buildah
# COPY content_set*.repo /etc/yum.repos.d/

########################################################################
# Common Installations and Configuration
########################################################################

RUN \
    # install all the rpms and modules
    microdnf install -y dnf && \
    # Disable codeready-builder repos to prevent accidentally installing incorrect packages
    dnf -y -q install 'dnf-command(config-manager)' && \
    dnf config-manager --set-disabled codeready-* && \
    dnf -y -q module reset container-tools maven nodejs php; \
    dnf -y -q module install container-tools:rhel8 maven:3.6 nodejs:$NODEJS_VERSION php:$PHP_VERSION && \
    dnf -y -q install --setopt=tsflags=nodocs \
        golang \
        java-1.8.0-openjdk java-1.8.0-openjdk-devel java-1.8.0-openjdk-headless \
            java-11-openjdk java-11-openjdk-devel java-11-openjdk-src java-11-openjdk-headless \
            java-17-openjdk java-17-openjdk-devel java-17-openjdk-headless \
        nodejs npm nodejs-nodemon nss_wrapper \
        make cmake gcc gcc-c++ \
            llvm-toolset clang clang-libs clang-tools-extra git-clang-format gdb \
        php php-cli php-fpm php-opcache php-devel php-pear php-gd php-intl php-mysqli php-zlib php-curl \
        python3.11 python3.11-devel python3.11-setuptools python3.11-pip python3.11-wheel \
        libssh-devel libffi-devel redhat-rpm-config cargo openssl-devel pkg-config jq \
        podman buildah skopeo fuse-overlayfs \
        e2fsprogs libatomic_ops git openssl-devel ca-certificates \
        bash bash-completion tar gzip unzip bzip2 which shadow-utils findutils wget curl sudo git git-lfs procps-ng tree vim \
        # For OpenShift Client 4 (oc): rhocp-4.12-for-rhel-8-x86_64-rpms
        # must hard code a version because otherwise CVP/Brew fails with: Failed component comparison for components: openshift-clients
        # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.12/os/Packages/o/odo-3.9.0-1.el8.x86_64.rpm
        # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.12/os/Packages/o/odo-3.9.0-1.el8.s390x.rpm
        # https://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp-tools/4.12/os/Packages/o/odo-3.9.0-1.el8.ppc64le.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/ocp/tools/4.12/os/Packages/h/helm-3.10.1-2.el8.x86_64.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/ocp/tools/4.12/os/Packages/h/helm-3.10.1-2.el8.s390x.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/ocp/tools/4.12/os/Packages/h/helm-3.10.1-2.el8.ppc64le.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.12/os/Packages/o/openshift-clients-4.12.0-202311221849.p0.gd2ac7e1.assembly.stream.el8.x86_64.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.12/os/Packages/o/openshift-clients-4.12.0-202311221849.p0.gd2ac7e1.assembly.stream.el8.s390x.rpm
        # http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.12/os/Packages/o/openshift-clients-4.12.0-202311221849.p0.gd2ac7e1.assembly.stream.el8.ppc64le.rpm
        odo-3.9.0-1.el8 helm-3.10.1-2.el8 openshift-clients-4.12.0-202311221849.p0.gd2ac7e1.assembly.stream.el8 \
    && \
    dnf -y -q reinstall shadow-utils && \
    # fetch CVE updates (can exclude rpms to prevent update, eg., --exclude=odo)
    dnf -y -q update && \
    dnf -y -q clean all --enablerepo='*' && \
    dnf -y -q clean all && rm -rf /var/cache/yum && \
    mkdir -p /opt && \
    # add user and configure it
    useradd -u 1000 -G wheel,root -d /home/user --shell /bin/bash -m user && \
    # Bash-related files are backed up to /home/tooling/ in case they are deleted when persistUserHome is enabled.
    cp /home/user/.bashrc /home/tooling/.bashrc && \
    cp /home/user/.bash_profile /home/tooling/.bash_profile && \
    # $PROFILE_EXT contains all additions made to the bash environment
    touch ${PROFILE_EXT} && \
    # Setup $PS1 for a consistent and reasonable prompt
    touch /etc/profile.d/udi_prompt.sh && \
    echo "export PS1='\W \`git branch --show-current 2>/dev/null | sed -r -e \"s@^(.+)@\(\1\) @\"\`$ '" >> /etc/profile.d/udi_prompt.sh && \
    # Change permissions to let any arbitrary user
    mkdir -p /projects && \
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
    > ${HOME}/group.template && \
    # Define user directory for binaries
    mkdir -p /home/tooling/.local/bin

RUN \
    ## Rootless podman install #2: install podman buildah skopeo e2fsprogs (above)
    ## Rootless podman install #3: tweaks to make rootless buildah work
    touch /etc/subgid /etc/subuid  && \
    chmod g=u /etc/subgid /etc/subuid /etc/passwd  && \
    echo user:10000:65536 > /etc/subuid  && \
    echo user:10000:65536 > /etc/subgid && \
    ## Rootless podman install #4: adjust storage.conf to enable Fuse storage.
    sed -i -e 's|^#mount_program|mount_program|g' -e '/additionalimage.*/a "/var/lib/shared",' /etc/containers/storage.conf && \
    mkdir -p /var/lib/shared/overlay-images /var/lib/shared/overlay-layers; \
    touch /var/lib/shared/overlay-images/images.lock; \
    touch /var/lib/shared/overlay-layers/layers.lock && \
    ## Rootless podman install #5: but use VFS since we were not able to make Fuse work yet...
    # TODO switch this to fuse in OCP 4.12?
    mkdir -p "${HOME}"/.config/containers && \
    (echo '[storage]';echo 'driver = "vfs"') > "${HOME}"/.config/containers/storage.conf && \
    ## Rootless podman install #6: rename podman to allow the execution of 'podman run' using
    ##                             kubedock but 'podman build' using podman.orig
    mv /usr/bin/podman /usr/bin/podman.orig && \
    # Docker alias
    echo 'alias docker=podman' >> ${PROFILE_EXT}

RUN \
    # configure runtimes
    ########################################################################
    # Common tooling configuration directories
    ########################################################################
    mkdir -p /home/tooling/.m2 && \
    mkdir -p /home/tooling/.config/pip && \
    mkdir -p /home/tooling/.cargo && \
    mkdir -p /home/tooling/certs && \
    mkdir -p /home/tooling/.composer && \
    mkdir -p /home/tooling/.nuget && \
    ########################################################################
    # Java
    ########################################################################
    mkdir -p ${HOME}/.java/current && \
    rm -f /usr/bin/java && \
    ln -s /usr/lib/jvm/java-17-openjdk/* ${HOME}/.java/current && \
    ########################################################################
    # Nodejs
    ########################################################################
    # see https://catalog.redhat.com/software/containers/ubi8/nodejs-16/615aee9fc739c0a4123a87e1?container-tabs=dockerfile
    SL=/usr/bin/nodemon; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/lib/node_modules/nodemon/bin/nodemon.js ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/bin/python3; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/libexec/platform-python ${SL}; else ls -la ${SL}; fi && \
    ########################################################################
    # additional node stuff
    mkdir -p /opt/app-root/src/.npm-global/bin && \
    ln -s /usr/bin/node /usr/bin/nodejs && \
    for f in "/opt/app-root/src/.npm-global"; do chgrp -R 0 ${f}; chmod -R g+rwX ${f}; done

RUN \
    ########################################################################
    # Python
    ########################################################################
    # BEGIN update to python 3.9 per https://catalog.redhat.com/software/containers/ubi8/python-39/6065b24eb92fbda3a4c65d8f?container-tabs=dockerfile
    # End update to python 3.9 per https://catalog.redhat.com/software/containers/ubi8/python-39/6065b24eb92fbda3a4c65d8f?container-tabs=dockerfile
    # update pip & other dependencies from cachito
    cd $REMOTE_SOURCES_DIR/python-deps/app/devspaces-udi/build/python && \
    source $REMOTE_SOURCES_DIR/python-deps/cachito.env && \
    set -xe; \
    python${PYTHON_VERSION} -m pip install --user --no-cache-dir --upgrade pip setuptools pytest flake8 virtualenv yq && \
    # python/pip/flake8/yq symlinks
    echo "Create python symlinks (or display existing ones) ==>" && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pip \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pip && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pip \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pip${PYTHON_VERSION} && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m flake8 \$*" | sed -r -e "s@#@#\!@" > /usr/bin/flake8 && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m flake8 \$*" | sed -r -e "s@#@#\!@" > /usr/bin/flake8${PYTHON_VERSION} && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pytest \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pytest && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m pytest \$*" | sed -r -e "s@#@#\!@" > /usr/bin/pytest${PYTHON_VERSION} && \
    echo -e "#/usr/bin/bash\n/usr/bin/python${PYTHON_VERSION} -m yq \$*" | sed -r -e "s@#@#\!@" > /usr/bin/yq && \
    chmod +x /usr/bin/pip* /usr/bin/py* /usr/bin/yq && \
    SL=/usr/local/bin/python; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/python${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pip; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pip${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/flake8; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/flake8${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/pytest; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/pytest${PYTHON_VERSION} ${SL}; else ls -la ${SL}; fi && \
    SL=/usr/local/bin/yq; if [[ ! -f ${SL} ]] && [[ ! -L ${SL} ]]; then ln -s /usr/bin/yq ${SL}; else ls -la ${SL}; fi && \
    chmod +x /usr/local/bin/* && \
    echo -n "/usr/local/bin/python: "; /usr/local/bin/python -V && \
    echo -n "/usr/local/bin/pip: ";    /usr/local/bin/pip -V && \
    echo -n "/usr/local/bin/flake8: "; /usr/local/bin/flake8 --version && \
    echo -n "/usr/local/bin/pytest: "; /usr/local/bin/pytest --version && \
    echo -n "/usr/local/bin/yq:     "; /usr/local/bin/yq --version && \
    # set up ~/.venv
    cd /home/tooling; /usr/bin/python${PYTHON_VERSION} -m venv .venv && \
    echo "<== Create python symlinks (or display existing ones)"
    # TODO: to enable flake8 as default linter, add this to project's .vscode/settings.json file
    # {
    #     "python.linting.flake8Enabled": true,
    #     "python.linting.enabled": true,
    #     "python.linting.pylintEnabled": false
    # }

RUN \
    ########################################################################
    # Ansible
    ########################################################################
    mkdir -p ${HOME}/.ansible/roles ${HOME}/.ansible/tmp \
    /usr/share/ansible/roles /etc/ansible/roles && \
    chgrp -R 0 ${HOME}/.ansible && \
    chmod -R g+rwX ${HOME}/.ansible

RUN \
    ########################################################################
    # C/C++ (Tech Preview)
    ########################################################################
    # to see what requires kernel-headers, use: dnf install --exclude=kernel*
    # or query: rpm -q --whatrequires kernel-headers && rpm -q --whatrequires glibc-headers && rpm -q --whatrequires glibc-devel && rpm -q --whatrequires gcc
    mkdir -p ${HOME}/che/ls-csharp ${HOME}/che/ls-clangd && \
    echo "clangd -pretty" > ${HOME}/che/ls-clangd/launch.sh && \
    chmod +x ${HOME}/che/ls-clangd/launch.sh && \
    ########################################################################
    # .NET (dotnet) 6.0 (s390x and x64 only) + 7.0 (ppc64le, s390x and x64 only) (Tech Preview)
    ########################################################################
    # TODO: dotnet 6 will EOL Nov 12, 2024 - see https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
    # TODO: dotnet 7 will EOL May 14, 2024 - see https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
    if [[ "$(uname -m)" == 'x86_64' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-6.0 dotnet-sdk-7.0; \
    elif [[ "$(uname -m)" == 's390x' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-6.0 dotnet-sdk-7.0; \
    elif [[ "$(uname -m)" == 'ppc64le' ]]; then \
        dnf -y -q --setopt=tsflags=nodocs install dotnet dotnet-sdk-7.0; \
    fi && \
    ########################################################################
    # PHP (Tech Preview) - see https://catalog.redhat.com/software/containers/ubi8/php-73/5d400891bed8bd38099104e0
    ########################################################################
    set -x; \
    # compile xdebug from the container-yaml-name/app/ folder
    cd $REMOTE_SOURCES_DIR/xdebug/app/ && \
    # ls -la . && \
    # According to https://xdebug.org/docs/faq#api, must have the same value from php -i | grep "Zend Extension Build" and phpize | grep "Extension Api"
    # Zend Extension Build => API320180731,NTS
    # Zend Extension Api No:   320180731
    php -i | grep "Zend Extension Build"; phpize | grep "Extension Api" ; \
    ./configure --enable-xdebug; make; make install && \
    # do we need all these settings? or just the zend_extension?
    echo -e "[xdebug]\n\
zend_extension=$(find /usr/lib64/php/modules -name xdebug.so)\n\
xdebug.client_port = 9001\n\
xdebug.mode = debug\n\
xdebug.start_with_request = yes\n\
xdebug.log=\${HOME}/xdebug.log" >> /etc/php.ini && \
    if [[ -f /etc/php.ini ]]; then grep xdebug /etc/php.ini; fi && \
    # set up httpd
    sed -i 's/opt\/app-root\/src/projects/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/#DocumentRoot/DocumentRoot/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/CustomLog \"|\/usr\/bin\/cat\"/CustomLog \"\/var\/log\/httpd\/access_log\"/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/ErrorLog \"|\/usr\/bin\/cat\"/ErrorLog \"\/var\/log\/httpd\/error_log\"/' /etc/httpd/conf/httpd.conf && \
    chmod -R 777 /var/run/httpd /var/log/httpd/ /etc/pki/ /etc/httpd/logs/ \
        /etc/httpd/conf/httpd.conf /etc/php.ini ${HOME}/xdebug.log && \
    # verify xdebug works
    php --ini; echo "<?php xdebug_info() ?>" | php; php -v

# CRW-3193 disable until we have a camel-k sample again
# RUN \
#     ########################################################################
#     # Kamel
#     ########################################################################
#     if [[ -f /usr/local/bin/kamel ]]; then rm -f /usr/local/bin/kamel; fi;

# COPY --from=go-builder $REMOTE_SOURCES_DIR/camelk/app/kamel /usr/local/bin/kamel

# see container.yaml
COPY --from=go-builder $REMOTE_SOURCES_DIR/gopls/app/gopls/gopls $HOME/go/bin/gopls
COPY --from=go-builder $REMOTE_SOURCES_DIR/kubedock/app/kubedock $HOME/go/bin/kubedock
COPY --from=go-builder $REMOTE_SOURCES_DIR/stow/app/build/bin/ /usr/bin/
COPY --from=go-builder $REMOTE_SOURCES_DIR/stow/app/build/share/ /usr/share/

# Create symbolic links from /home/tooling/ -> /home/user/
RUN stow . -t /home/user/ -d /home/tooling/ --no-folding && \
    # .viminfo cannot be a symbolic link for security reasons, so copy it to /home/user/
    cp /home/tooling/.viminfo /home/user/.viminfo


    ########################################################################
    # Cleanup and Summaries
    ########################################################################
RUN \
    rm -fr $REMOTE_SOURCES_DIR && \
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
    echo -n "mvn:    "; mvn -version; \
    echo "========" && \
    echo -n "node:  "; node --version; \
    echo -n "npm:   "; npm --version; \
    echo "========" && \
    echo "python basic install:"; python -V; \
    echo -n "pip:    "; pip -V; \
    echo -n "flake8: "; flake8 --version | tr "\n" "," | sed -r -e "s@,\$@\n@"; \
    echo -n "pytest: "; pytest --version; \
    echo -n "jq:     "; jq --version; \
    echo -n "yq:     "; yq --version; \
    echo "========" && \
    echo "python venv install:"; source ${HOME}/.venv/bin/activate && python -V; \
    echo -n "pip:    "; pip -V; \
    echo -n "flake8: "; flake8 --version | tr "\n" "," | sed -r -e "s@,\$@\n@"; \
    echo -n "pytest: "; pytest --version; \
    echo -n "jq:     "; jq --version; \
    echo -n "yq:     "; yq --version; \
    echo "========" && \
    echo -n "oc:      "; oc version; \
    echo -n "odo:     "; odo version; \
    echo -n "helm:    "; helm version --short --client; \
    echo -n "kubectl: "; kubectl version --short --client=true; \
    echo "========" && \
    echo -n "e2fsck: "; e2fsck -V; \
    echo -n "fuse2fs: "; fuse2fs -V; \
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

# A last pass to make sure that an arbitrary user can write in $HOME
RUN chgrp -R 0 /home && chmod -R g=u /home

ENV HOME=/home/user
ENTRYPOINT [ "/entrypoint.sh" ]
WORKDIR /projects
CMD tail -f /dev/null
