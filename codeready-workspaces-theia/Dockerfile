# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
###
# Builder Image
#
FROM registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-theia-dev-rhel8:2.13 as builder

WORKDIR ${HOME}

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

ARG THEIA_GITHUB_REPO=eclipse-theia/theia

# Define upstream version of theia to use
ARG THEIA_VERSION=master

ARG THEIA_COMMIT_SHA=''

ENV NODE_OPTIONS="--max-old-space-size=4096"

# avoid any linter/formater/unit test
ENV SKIP_LINT=true SKIP_FORMAT=true SKIP_TEST=true


# Clone theia
COPY asset-theia-source-code.tar.gz /tmp/asset-theia-source-code.tar.gz
RUN tar xzf /tmp/asset-theia-source-code.tar.gz -C ${HOME} && rm -f /tmp/asset-theia-source-code.tar.gz

#apply patch for Theia loader
COPY asset-branding.tar.gz /tmp/asset-branding.tar.gz
RUN tar xvzf /tmp/asset-branding.tar.gz -C /tmp; cp /tmp/branding/loader/CodeReady_icon_loader.svg ${HOME}/theia-source-code/packages/core/src/browser/icons/CodeReady_icon_loader.svg
RUN cd ${HOME}/theia-source-code && git apply /tmp/branding/loader/loader.patch
# patch electron module by removing native keymap module (no need to have some X11 libraries)
RUN line_to_delete=$(grep -n native-keymap ${HOME}/theia-source-code/dev-packages/electron/package.json | cut -d ":" -f 1) && \
    if [[ ${line_to_delete} ]]; then \
        sed -i -e "${line_to_delete},1d" ${HOME}/theia-source-code/dev-packages/electron/package.json; \
    else \
        echo "[WARNING] native-keymap not found in ${HOME}/theia-source-code/dev-packages/electron/package.json"; \
    fi

# Patch theia
# Add patches
ADD src/patches ${HOME}/patches

# Apply patches
RUN if [ -d "${HOME}/patches/${THEIA_VERSION}" ]; then \
    echo "Applying patches for Theia version ${THEIA_VERSION}"; \
    for file in $(find "${HOME}/patches/${THEIA_VERSION}" -name '*.patch'); do \
      echo "Patching with ${file}"; \
      # if patch already applied, don't ask if it's a reverse-patch and just move on with the build without throwing an error
      cd ${HOME}/theia-source-code && patch -p1 < ${file} --forward --silent || true; \
    done \
    fi


# Generate che-theia
ARG CDN_PREFIX="https://static.developers.redhat.com/che/crw_theia_artifacts/"
ARG MONACO_CDN_PREFIX="https://cdn.jsdelivr.net/npm/"
WORKDIR ${HOME}/theia-source-code

# Add che-theia repository content
COPY asset-che-theia.tar.gz /tmp/asset-che-theia.tar.gz
RUN mkdir -p ${HOME}/theia-source-code/che-theia/ && tar xzf /tmp/asset-che-theia.tar.gz -C ${HOME}/theia-source-code/che-theia/ && rm /tmp/asset-che-theia.tar.gz

# run che-theia init command and alias che-theia repository to use local sources insted of cloning
RUN che-theia init -c ${HOME}/theia-source-code/che-theia/che-theia-init-sources.yml --alias https://github.com/eclipse-che/che-theia=${HOME}/theia-source-code/che-theia

# cleanup theia folders that we don't need to compile
RUN rm -rf ${HOME}/theia-source-code/examples/browser && \
    rm -rf ${HOME}/theia-source-code/examples/electron && \
    rm -rf ${HOME}/theia-source-code/packages/cpp && \
    rm -rf ${HOME}/theia-source-code/packages/git && \
    rm -rf ${HOME}/theia-source-code/packages/java && \
    rm -rf ${HOME}/theia-source-code/packages/java-debug && \
    rm -rf ${HOME}/theia-source-code/packages/python && \
    rm -rf ${HOME}/theia-source-code/packages/typescript && \
    # Allow the usage of ELECTRON_SKIP_BINARY_DOWNLOAD=1 by using a more recent version of electron \
    sed -i 's|  "resolutions": {|  "resolutions": {\n    "**/electron": "7.0.0",\n    "**/keytar": "7.6.0", \n    "**/node-addon-api": "3.1.0",|' ${HOME}/theia-source-code/package.json && \
    # remove all electron-browser module to not compile them
    find . -name "electron-browser"  | xargs rm -rf {} && \
    find . -name "*-electron-module.ts"  | xargs rm -rf {} && \
    rm -rf ${HOME}/theia-source-code/dev-packages/electron/native && \
    echo "" > ${HOME}/theia-source-code/dev-packages/electron/scripts/post-install.js && \
    # Remove linter/formatters of theia
    sed -i 's|concurrently -n compile,lint -c blue,green \\"theiaext compile\\" \\"theiaext lint\\"|concurrently -n compile -c blue \\"theiaext compile\\"|' ${HOME}/theia-source-code/dev-packages/ext-scripts/package.json && \
    # Remove external configs removed
    sed -i -n '/.*packages\/cpp/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/git/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/java/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/java-debug/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/python/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/typescript/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*examples\/api-samples/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*examples\/electron/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    # change update goal to be the eclipse che assembly
    sed -i 's|.*"prepare:build".*|    \"prepare:build\"\: \"yarn build \&\& lerna run build\", |' ${HOME}/theia-source-code/package.json && \
    cat ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json

RUN che-theia cdn --theia="${CDN_PREFIX}" --monaco="${MONACO_CDN_PREFIX}"

# Compile Theia
#{IF:DO_REMOTE_CHECK}


RUN echo ${HOME} && cd ${HOME} && tar zxf eclipse-che-theia-generator.tgz && mv package eclipse-che-theia-generator && \
    ls -la /home/theia-dev/*

RUN yum install -y libsecret libsecret-devel make cmake gcc gcc-c++



#ENDIF

COPY asset-yarn-*.tar.gz asset-post-download-dependencies-*.tar.gz /tmp/
RUN tar xzf /tmp/asset-yarn-$(uname -m).tar.gz -C / && rm -f /tmp/asset-yarn-*.tar.gz && \
    tar xzf /tmp/asset-post-download-dependencies-$(uname -m).tar.gz -C / && rm -f /tmp/asset-post-download-dependencies-*.tar.gz

# Copy yarn.lock to be the same than the previous build
COPY asset-yarn-*.lock /tmp/
RUN cp /tmp/asset-yarn-$(uname -m).lock ${HOME}/theia-source-code/yarn.lock && rm -f /tmp/asset-yarn-*.lock

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    puppeteer_skip_chromium_download=true

COPY asset-node-headers.tar.gz ${HOME}/asset-node-headers.tar.gz
RUN \
    # Use local file for node headers
    npm config set tarball ${HOME}/asset-node-headers.tar.gz && \
    # Disable puppeteer from downloading chromium
    npm config set puppeteer_skip_chromium_download true -g && \
    yarn config set puppeteer_skip_chromium_download true -g && \
    # Disable travis script
    echo "#!/usr/bin/env node" > /home/theia-dev/theia-source-code/scripts/prepare-travis \
    # Add offline mode in examples
    && sed -i -e "s|spawnSync('yarn', \[\]|spawnSync('yarn', \['--offline'\]|" ${HOME}/theia-source-code/plugins/foreach_yarn \
    # Disable automatic tests that connect online
    && for d in plugins/*/package.json; do echo "Disable 'yarn test' in $d"; sed -i -e "s/ && yarn test//" $d; done

# enable offline move (no DNS resolution)
# comment out -- this fails with "Device or resource busy"
# RUN mv /etc/resolv.conf{,.BAK} && echo "" > /etc/resolv.conf
RUN echo "" > /etc/resolv.conf || true
# kill all electron 
RUN rm -fr /home/theia-dev/theia-source-code/node_modules/*/electron /home/theia-dev/theia-source-code/node_modules/*electron* || true

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi && \
    yarn ${YARN_FLAGS}

# Run into production mode
# revert offline mode (put back previous DNS resolution)
# comment out -- this fails with "Device or resource busy"
# RUN rm -f /etc/resolv.conf && mv /etc/resolv.conf{.BAK,} || true
RUN che-theia production

# Compile plugins
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi && \
    cd plugins && ./foreach_yarn

# Add yeoman generator & vscode git plug-ins
COPY asset-untagged-theia_yeoman_plugin.theia /home/theia-dev/theia-source-code/production/plugins/theia_yeoman_plugin.theia


# Use node image
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM ubi8/nodejs-12:1-98.1634036321 as build-result
USER root

COPY --from=builder /home/theia-dev/theia-source-code/production /che-theia-build

# change permissions
RUN find /che-theia-build -exec sh -c "chgrp 0 {}; chmod g+rwX {}" \; 2>log.txt && \
    # Add missing permissions on shell scripts of plug-ins
    find /che-theia-build/plugins -name "*.sh" | xargs chmod +x

###
# Runtime Image
#

# Use node image
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM ubi8/nodejs-12:1-98.1634036321 as runtime
USER 0
RUN yum -y -q update --nobest && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ENV USE_LOCAL_GIT=true \
    HOME=/home/theia \
    SHELL=/bin/bash \
    THEIA_DEFAULT_PLUGINS=local-dir:///default-theia-plugins \
    # Specify the directory of git (avoid to search at init of Theia)
    LOCAL_GIT_DIRECTORY=/usr \
    GIT_EXEC_PATH=/usr/libexec/git-core \
    # Ignore from port plugin the default hosted mode port
    PORT_PLUGIN_EXCLUDE_3130=TRUE \
    YARN_FLAGS=""

# setup extra stuff
#Copy branding files
COPY --from=builder /tmp/branding ${HOME}/branding

ENV YARN_FLAGS="--offline"

ENV SUMMARY="Red Hat CodeReady Workspaces - theia container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - theia container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="theia-rhel8" \
    PRODUCT_JSON=${HOME}/branding/product.json

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

EXPOSE 3100 3130

COPY --from=build-result /che-theia-build/plugins /default-theia-plugins

# need root user
USER root

# Copy sshpass sources
COPY asset-sshpass-sources.tar.gz /tmp/

# Install sudo
# Install git
# Install bzip2 to unpack files
# Install which tool in order to search git
# Install curl and bash
# Install ssh for cloning ssh-repositories
# Install less for handling git diff properly
# Install sshpass for handling passwords for SSH keys
# Install libsecret as Theia requires it
# Install libsecret-devel on s390x and ppc64le for keytar build (binary included in npm package for x86)
RUN yum install -y sudo git bzip2 which bash curl openssh less \
    libsecret libsecret-devel \
    && tar -xvf /tmp/asset-sshpass-sources.tar.gz -C /tmp/ && \
    cd /tmp/sshpass-*/ && ./configure && make install && cd .. && rm -rf *sshpass-* && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

# setup yarn (if missing)
# Include yarn assets for runtime image
COPY asset-yarn-runtime-image-*.tar.gz /tmp/
RUN tar xzf /tmp/asset-yarn-runtime-image-$(uname -m).tar.gz -C / && \
    rm -f /tmp/asset-yarn-runtime-image-*.tar.gz

 RUN \
    adduser -r -u 1002 -G root -d ${HOME} -m -s /bin/sh theia \
    && echo "%wheel ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers \
    # Create /projects for Che
    && mkdir /projects \
    # Create root node_modules in order to not use node_modules in each project folder
    && mkdir /node_modules \
    && for f in "${HOME}" "/etc/passwd" "/etc/group /node_modules /default-theia-plugins /projects"; do\
           sudo chgrp -R 0 ${f} && \
           sudo chmod -R g+rwX ${f}; \
       done \
    && cat /etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > ${HOME}/passwd.template \
    && cat /etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > ${HOME}/group.template \
    # Add yeoman, theia plugin & VS Code generator and typescript (to have tsc/typescript working)
    && yarn global add ${YARN_FLAGS} yo @theia/generator-plugin@0.0.1-1622834185 generator-code typescript@3.5.3 \
    && mkdir -p ${HOME}/.config/insight-nodejs/ \
    && chmod -R 777 ${HOME}/.config/ \
    # Disable the statistics for yeoman
    && echo '{"optOut": true}' > $HOME/.config/insight-nodejs/insight-yo.json \
    #{IF:DO_CLEANUP}
    # Link yarn global modules for yeoman
    && local_modules=$(ls -d1 /usr/*/node_modules 2>/dev/null || ls -d1 /usr/*/*/node_modules) \
    && mv ${local_modules}/* /usr/local/share/.config/yarn/global/node_modules && rm -rf ${local_modules} && ln -s /usr/local/share/.config/yarn/global/node_modules $(dirname ${local_modules})/ \
    # Cleanup tmp folder
    && rm -rf /tmp/* \
    # Cleanup yarn cache
    && yarn cache clean \
    #ENDIF
    # Change permissions to allow editing of files for openshift user
    && find ${HOME} -exec sh -c "chgrp 0 {}; chmod g+rwX {}" \;

COPY --chown=theia:root --from=build-result /che-theia-build /home/theia
USER theia
WORKDIR /projects
COPY src/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
