# Copyright (c) 2022-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# The Dockerfile works only in Brew, as it is customized for Cachito fetching
# project sources and yarn dependencies, and performing an offline build with them

#########################################################################
############################# BUILD 1: libc-ubi8 ########################
#########################################################################

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM ubi8/nodejs-18:1-102 as checode-linux-libc-ubi8-builder
# hadolint ignore=DL3002
USER root

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NPM_CONFIG_NODEDIR=/usr

ENV CXXFLAGS='-DNODE_API_EXPERIMENTAL_NOGC_ENV_OPT_OUT'

# cachito:yarn step 1: copy cachito sources where we can use them; source env vars; set working dir
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# Enable pulp content sets to resolve libsecret & libxkbfile as rpm
COPY $REMOTE_SOURCES/devspaces-images-code/app/devspaces-code/build/dockerfiles/content_sets_pulp.repo /etc/yum.repos.d/

# node-gyp 10 requires python 3.7 - 3.10
# hadolint ignore=DL3040,DL3041
RUN \
    dnf -y -q module reset   python39; dnf -y -q module install python39:3.9 && \
    dnf module install -y nodejs:18/development && \
    dnf install -y libsecret-devel libsecret curl make cmake gcc gcc-c++ \
    git git-core-doc openssh openssl-devel ca-certificates \
    less libX11-devel libxkbcommon libxkbfile-devel libxkbfile bash tar gzip rsync patch tree jq

# hadolint ignore=SC2086
RUN source $REMOTE_SOURCES_DIR/devspaces-images-code/cachito.env; \
       cat $REMOTE_SOURCES_DIR/devspaces-images-code/cachito.env 

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
# hadolint ignore=SC2086
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn


# VS Code depends on @vscode/ripgrep that downloads the required ripgrep binary from microsoft/ripgrep-prebuilt
# during 'yarn install' phase. That doen't work in OSBS due to offline mode.
# So, we upload the required binaries to download.devel to be able to download them in OSBS environment (see fetch-artifacts-url.yaml).
# Before trying to fetch the binary from GitHub, @vscode/ripgrep looks for it in the local cache folder.
# See the cache folder name pattern in https://github.com/microsoft/vscode-ripgrep/blob/a85a6872107d616942511ea4421f438608b6579a/lib/download.js#L15
#
# For each @vscode/ripgrep version VS Code currently depends on
# create a cache folder with the required binary version.
COPY artifacts/ripgrep-*.tar.gz /tmp/vscode-ripgrep-cache-1.15.9/

# See the required binary version in https://github.com/microsoft/vscode-ripgrep/blob/main/lib/postinstall.js#L21

RUN echo "######################################################## /tmp/vscode-ripgrep-cache"; \
    find /tmp -name '*.tar.gz';


# There're a few VS Code built-in extensions that are not in the VS Code repository, but hosted on GitHub.
# https://github.com/redhat-developer/devspaces-images/blob/devspaces-3-rhel-8/devspaces-code/code/product.json#L35
# By default, VS Code downloads them from GitHub during the build. That doen't work in OSBS due to offline mode.
# We rebuild these VS Code built-ins with uploading vsix to download.devel to download them in OSBS environment (see fetch-artifacts-url.yaml).
# Before trying to fetch the vsix from GitHub, VS Code looks for it in the local cache folder.
# 
# Unpack the vsix files to '.build/builtInExtensions/ext_publisher.ext_name'.
# 
# For the details, see 'build/lib/builtInExtensions.ts'.
COPY artifacts/*.vsix /tmp/builtInExtensions/
RUN for vsixfile in /tmp/builtInExtensions/*; do \
        # get the file name without the path
        basename="${vsixfile##*/}"; \
        # get the file name without the extension
        filename="${basename%.*}"; \
        # create the cache folder where gulp build checks for the pre-downloaded extensions
        mkdir -p .build/builtInExtensions; \
        # unzip the 'extension' sub-folder only
        ext_folder=.build/builtInExtensions/$filename; \
        unzip $vsixfile extension/* -d $ext_folder; \
        mv $ext_folder/extension/* $ext_folder; \
    done;


# Initialize a git repository for code build tools
RUN git init .; \
    # change network timeout (slow using multi-arch build)
    yarn config set network-timeout 600000 -g; \

    # cachito:yarn step 3: configure yarn & install deps
    # see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
    yarn config set nodedir /usr; yarn config set unsafe-perm true;


# Normally, we call 'yarn' on VS Code to install the dependencies:
# - for the root package;
# - for the sub-packages (extensions), by triggerring the `build/npm/postinstall.js`.
# The problem here is that the script can't fetch the dependencies from the Cachito's Nexus registry.
# It responds "401 Unauthorized" when yarn tries to fetch a dependency for any VS Code's sub-package.
# However, it works well for the root package.
#
# The workaround is to disable the 'yarn install' call for the sub-packages ...
RUN sed -i -r -e '/function yarnInstall/ !s|^[^#]*yarnInstal|//&|' build/npm/postinstall.js
# ... and run the dependencies installation manually for each sub-package listed in the 'code/build/npm/dirs.js' (except the 'test' folder).

# install node-gyp - workaround for `yarn global add node-gyp`, since installing it
# globally it tries to fetch it from outside. So, we install locally the module
# that has node-gyp dependency, and then put it's node_modules to yarns global modules
RUN cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/cachito \
 && yarn \
 && mkdir -p $(yarn global dir) && cp -r $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/cachito/node_modules/. $(yarn global dir)/node_modules \
 && mkdir -p $(yarn global bin) && ln -s $(yarn global dir)/node_modules/.bin/node-gyp $(yarn global bin)/node-gyp \
 && ls -l $(yarn global bin) \
 && ls -l $(yarn global dir)/node_modules/.bin \
 && which node-gyp \
 && node-gyp version

# Cachito clears all project's '.yarnrc' files, To make sure yarn is configured to the local Nexus.
# To avoid any possible issues, like failure of build because of missing 'ms_build_id', or 'target' properties,
# or @parcel/watcher skipping compilation because of missing 'build_from_source' flag.
# We need to restore some of the fields before running the build.
# https://github.com/microsoft/vscode/blob/bceaaf84a27c3a95a0cdfc79287e3215b56b951c/build/gulpfile.reh.js#L128
RUN echo 'target "19.1.8"' > $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'ms_build_id "23084831"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'build_from_source "true"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'target "18.16.1"' > $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc; \
    echo 'ms_build_id "223745"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc;

# begin of module list generated by sync.sh
RUN cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/ && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/build && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-activity-tracker && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-api && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-commands && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-port && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-remote && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-resource-monitor && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-terminal && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-github-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/configuration-editing && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/css-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/css-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/debug-auto-launch && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/debug-server-ready && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/emmet && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/extension-editing && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/git && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/git-base && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/github && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/github-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/grunt && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/gulp && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/html-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/html-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/ipynb && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/jake && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/json-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/json-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-math && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/media-preview && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/merge-conflict && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/microsoft-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/notebook-renderers && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/npm && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/php-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/references-view && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/search-result && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/simple-browser && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/tunnel-forwarding && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/typescript-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-api-tests && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-colorize-tests && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-test-resolver && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/web && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.vscode/extensions/vscode-selfhost-test-provider && yarn 
# end of module list generated by sync.sh

# hadolint ignore=SC3045
RUN echo "$(ulimit -a)"

# Compile
# hadolint ignore=SC2086,DL4006
RUN set -x; \
    NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc | grep target | cut -d ' ' -f 2 | tr -d '"') \
    && echo "#####>> Arch & Version: $NODE_ARCH; $NODE_VERSION <<#####" \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node"; \
    cp /usr/bin/node $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node; \

    echo "########################################################path"; \
    # add bin folder to path to resolve gulp and other binaries
    export PATH=${PATH}:$REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/node_modules/.bin; \
    echo $PATH; \

    NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min -LLLL \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

### Che Code Launcher
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/launcher/
RUN yarn \
    && mkdir /checode/launcher \
    && cp -r out/src/*.js /checode/launcher \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

#########################################################################
############################# BUILD 2: libc-ubi9 ########################
#########################################################################

# https://registry.access.redhat.com/ubi9/nodejs-18
FROM ubi9/nodejs-18:1-108.1715236127 as checode-linux-libc-ubi9-builder
# hadolint ignore=DL3002
USER root

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NPM_CONFIG_NODEDIR=/usr

ENV CXXFLAGS='-DNODE_API_EXPERIMENTAL_NOGC_ENV_OPT_OUT'

# cachito:yarn step 1: copy cachito sources where we can use them; source env vars; set working dir
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# Enable pulp content sets to resolve libsecret & libxkbfile as rpm
COPY $REMOTE_SOURCES/devspaces-images-code/app/devspaces-code/build/dockerfiles/content_sets_pulp.repo /etc/yum.repos.d/

RUN echo "Repo list is: $(dnf repolist)" && \
    echo "Disabling rhel-8 based repos..." && \
    dnf config-manager --set-disabled 'rhel-8*' && \
    echo "Repo list after disabling rhel-8 based repos is: $(dnf repolist)" && \
    echo "$(dnf module list nodejs)"

# node-gyp 10 requires python 3.7 - 3.10
# hadolint ignore=DL3040,DL3041
RUN \
    dnf install -y \
    --enablerepo=rhel-9-for-baseos-rpms-pulp \
    --enablerepo=rhel-9-for-appstream-rpms-pulp \
    --enablerepo=rhel-9-for-codeready-builder-rpms-pulp \
    nodejs-devel libsecret-devel libsecret krb5-devel make gcc gcc-c++ \
    git git-core-doc openssh ca-certificates \
    less libX11-devel libxkbcommon libxkbfile-devel libxkbfile bash tar gzip rsync patch tree

# hadolint ignore=SC2086
RUN source $REMOTE_SOURCES_DIR/devspaces-images-code/cachito.env; \
       cat $REMOTE_SOURCES_DIR/devspaces-images-code/cachito.env 

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
# hadolint ignore=SC2086
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn


# VS Code depends on @vscode/ripgrep that downloads the required ripgrep binary from microsoft/ripgrep-prebuilt
# during 'yarn install' phase. That doen't work in OSBS due to offline mode.
# So, we upload the required binaries to download.devel to be able to download them in OSBS environment (see fetch-artifacts-url.yaml).
# Before trying to fetch the binary from GitHub, @vscode/ripgrep looks for it in the local cache folder.
# See the cache folder name pattern in https://github.com/microsoft/vscode-ripgrep/blob/a85a6872107d616942511ea4421f438608b6579a/lib/download.js#L15
#
# For each @vscode/ripgrep version VS Code currently depends on
# create a cache folder with the required binary version.
COPY artifacts/ripgrep-*.tar.gz /tmp/vscode-ripgrep-cache-1.15.9/

# See the required binary version in https://github.com/microsoft/vscode-ripgrep/blob/main/lib/postinstall.js#L21

RUN echo "######################################################## /tmp/vscode-ripgrep-cache"; \
    find /tmp -name '*.tar.gz';


# There're a few VS Code built-in extensions that are not in the VS Code repository, but hosted on GitHub.
# https://github.com/redhat-developer/devspaces-images/blob/devspaces-3-rhel-8/devspaces-code/code/product.json#L35
# By default, VS Code downloads them from GitHub during the build. That doen't work in OSBS due to offline mode.
# We rebuild these VS Code built-ins with uploading vsix to download.devel to download them in OSBS environment (see fetch-artifacts-url.yaml).
# Before trying to fetch the vsix from GitHub, VS Code looks for it in the local cache folder.
# 
# Unpack the vsix files to '.build/builtInExtensions/ext_publisher.ext_name'.
# 
# For the details, see 'build/lib/builtInExtensions.ts'.
COPY artifacts/*.vsix /tmp/builtInExtensions/
RUN for vsixfile in /tmp/builtInExtensions/*; do \
        # get the file name without the path
        basename="${vsixfile##*/}"; \
        # get the file name without the extension
        filename="${basename%.*}"; \
        # create the cache folder where gulp build checks for the pre-downloaded extensions
        mkdir -p .build/builtInExtensions; \
        # unzip the 'extension' sub-folder only
        ext_folder=.build/builtInExtensions/$filename; \
        unzip $vsixfile extension/* -d $ext_folder; \
        mv $ext_folder/extension/* $ext_folder; \
    done;


# Initialize a git repository for code build tools
RUN git init .; \
    # change network timeout (slow using multi-arch build)
    yarn config set network-timeout 600000 -g; \

    # cachito:yarn step 3: configure yarn & install deps
    # see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
    yarn config set nodedir /usr; yarn config set unsafe-perm true;


# Normally, we call 'yarn' on VS Code to install the dependencies:
# - for the root package;
# - for the sub-packages (extensions), by triggerring the `build/npm/postinstall.js`.
# The problem here is that the script can't fetch the dependencies from the Cachito's Nexus registry.
# It responds "401 Unauthorized" when yarn tries to fetch a dependency for any VS Code's sub-package.
# However, it works well for the root package.
#
# The workaround is to disable the 'yarn install' call for the sub-packages ...
RUN sed -i -r -e '/function yarnInstall/ !s|^[^#]*yarnInstal|//&|' build/npm/postinstall.js
# ... and run the dependencies installation manually for each sub-package listed in the 'code/build/npm/dirs.js' (except the 'test' folder).

# install node-gyp - workaround for `yarn global add node-gyp`, since installing it
# globally it tries to fetch it from outside. So, we install locally the module
# that has node-gyp dependency, and then put it's node_modules to yarns global modules
RUN cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/cachito \
    && yarn \
    && mkdir -p $(yarn global dir) && cp -r $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/cachito/node_modules/. $(yarn global dir)/node_modules \
    && mkdir -p $(yarn global bin) && ln -s $(yarn global dir)/node_modules/.bin/node-gyp $(yarn global bin)/node-gyp \
    && ls -l $(yarn global bin) \
    && ls -l $(yarn global dir)/node_modules/.bin \
    && which node-gyp \
    && node-gyp version

# Cachito clears all project's '.yarnrc' files, To make sure yarn is configured to the local Nexus.
# To avoid any possible issues, like failure of build because of missing 'ms_build_id', or 'target' properties,
# or @parcel/watcher skipping compilation because of missing 'build_from_source' flag.
# We need to restore some of the fields before running the build.
# https://github.com/microsoft/vscode/blob/bceaaf84a27c3a95a0cdfc79287e3215b56b951c/build/gulpfile.reh.js#L128
RUN echo 'target "19.1.8"' > $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'ms_build_id "23084831"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'build_from_source "true"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.yarnrc; \
    echo 'target "18.16.1"' > $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc; \
    echo 'ms_build_id "223745"' >> $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc;

# begin of module list generated by sync.sh
RUN cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/ && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/build && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-activity-tracker && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-api && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-commands && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-port && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-remote && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-resource-monitor && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-terminal && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/che-github-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/configuration-editing && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/css-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/css-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/debug-auto-launch && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/debug-server-ready && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/emmet && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/extension-editing && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/git && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/git-base && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/github && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/github-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/grunt && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/gulp && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/html-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/html-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/ipynb && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/jake && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/json-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/json-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-language-features/server && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/markdown-math && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/media-preview && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/merge-conflict && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/microsoft-authentication && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/notebook-renderers && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/npm && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/php-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/references-view && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/search-result && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/simple-browser && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/tunnel-forwarding && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/typescript-language-features && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-api-tests && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-colorize-tests && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/extensions/vscode-test-resolver && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/web && yarn \
    && cd $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.vscode/extensions/vscode-selfhost-test-provider && yarn 
# end of module list generated by sync.sh

# hadolint ignore=SC3045
RUN echo "$(ulimit -a)"

# Compile
# hadolint ignore=SC2086,DL4006
RUN set -x; \
    NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/remote/.yarnrc | grep target | cut -d ' ' -f 2 | tr -d '"') \
    && echo "#####>> Arch & Version: $NODE_ARCH; $NODE_VERSION <<#####" \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node"; \
    cp /usr/bin/node $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node; \

    echo "########################################################path"; \
    # add bin folder to path to resolve gulp and other binaries
    export PATH=${PATH}:$REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/code/node_modules/.bin; \
    echo $PATH; \

    NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min -LLLL \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode \
    # cache libbrotli from this image to provide it to a user's container
    && mkdir -p /checode/ld_libs && find /usr/lib64 -name 'libbrotli*' 2>/dev/null | xargs -I {} cp -t /checode/ld_libs {}

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

### Che Code Launcher
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code/launcher/
RUN yarn \
    && mkdir /checode/launcher \
    && cp -r out/src/*.js /checode/launcher \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode


#########################################################################
############################# BUILD 3: machineexec#######################
#########################################################################

# NOTE: can't use scatch images in OSBS, because unable to start container process: exec: \"/bin/sh\": stat /bin/sh: no such file or directory
# so we must rebuild machineexec binary in this build
# https://registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.20.12-5 as machineexec-builder
ENV GOPATH=/go/
# hadolint ignore=DL3002
USER root

# cachito step 0: copy cachito sources where we can use them; set working dir
# because no pkg manager, no env vars to source
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-machineexec
# hadolint ignore=SC2086
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o che-machine-exec . && \
    mkdir -p /rootfs/go/bin && cp -rf $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-machineexec/che-machine-exec /rootfs/go/bin

#########################################################################
############################# BUILD 4: rootfs assembly ##################
#########################################################################

# https://registry.access.redhat.com/ubi8
FROM ubi8:8.9-1160 as ubi-builder

RUN mkdir -p /mnt/rootfs/projects /mnt/rootfs/home/che /mnt/rootfs/remote/data/Machine/
# hadolint ignore=DL3033
RUN yum install --installroot /mnt/rootfs tar gzip brotli libstdc++ coreutils glibc-minimal-langpack --releasever 8 --setopt install_weak_deps=false --nodocs -y && yum --installroot /mnt/rootfs clean all
RUN rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

WORKDIR /mnt/rootfs

# hadolint ignore=DL4006,SC2016
RUN cat /mnt/rootfs/etc/passwd | sed 's#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g' > /mnt/rootfs/home/che/.passwd.template \
    && cat /mnt/rootfs/etc/group | sed 's#root:x:0:#root:x:0:0,\${USER_ID}:#g' > /mnt/rootfs/home/che/.group.template

COPY /build/scripts/entrypoint*.sh /mnt/rootfs/
COPY /build/remote-config/settings.json /mnt/rootfs/remote/data/Machine/settings.json
COPY --from=checode-linux-libc-ubi8-builder --chown=0:0 /checode /mnt/rootfs/checode-linux-libc/ubi8
COPY --from=checode-linux-libc-ubi9-builder --chown=0:0 /checode /mnt/rootfs/checode-linux-libc/ubi9
COPY --from=machineexec-builder --chown=0:0 /rootfs/go/bin/che-machine-exec /mnt/rootfs/bin/machine-exec

# hadolint ignore=SC2086
RUN for f in "/mnt/rootfs/bin/" "/mnt/rootfs/home/che" "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/projects" "/mnt/rootfs/entrypoint*.sh" "/mnt/rootfs/checode-linux-libc" "/mnt/rootfs/remote/data/Machine/settings.json" ; do\
           chgrp -R 0 ${f} && \
           chmod -R g+rwX ${f}; \
       done

RUN rm /mnt/rootfs/etc/hosts

#########################################################################
############################# BUILD 5: minimal final image ##############
#########################################################################

# https://registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.9-1161
COPY --from=ubi-builder /mnt/rootfs/ /
ENV HOME=/home/che
USER 1001
ENTRYPOINT ["/entrypoint.sh"]

ENV SUMMARY="Red Hat OpenShift Dev Spaces with Microsoft Visual Studio Code - Open Source IDE" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces with Microsoft Visual Studio Code - Open Source IDE" \
    PRODNAME="devspaces" \
    COMPNAME="code-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.14" \
      license="EPLv2" \
      maintainer="Roman Nikitenko <rnikiten@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
      