# Copyright (c) 2021-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# https://catalog.redhat.com/software/containers/ubi8/nodejs-16/615aee9fc739c0a4123a87e1?container-tabs=overview
FROM registry.access.redhat.com/ubi8/nodejs-16:1-37.1652296488 as linux-libc-builder

USER root

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi

# Install libsecret-devel on s390x and ppc64le for keytar build (binary included in npm package for x86)
RUN { if [[ $(uname -m) == "s390x" ]]; then LIBSECRET="\
      https://rpmfind.net/linux/fedora-secondary/releases/34/Everything/s390x/os/Packages/l/libsecret-0.20.4-2.fc34.s390x.rpm \
      https://rpmfind.net/linux/fedora-secondary/releases/34/Everything/s390x/os/Packages/l/libsecret-devel-0.20.4-2.fc34.s390x.rpm"; \
    elif [[ $(uname -m) == "ppc64le" ]]; then LIBSECRET="\
      libsecret \
      https://rpmfind.net/linux/centos/8-stream/BaseOS/ppc64le/os/Packages/libsecret-devel-0.18.6-1.el8.ppc64le.rpm"; \
    elif [[ $(uname -m) == "x86_64" ]]; then LIBSECRET="\
      https://rpmfind.net/linux/centos/8-stream/BaseOS/x86_64/os/Packages/libsecret-devel-0.18.6-1.el8.x86_64.rpm \
      libsecret"; \
    elif [[ $(uname -m) == "aarch64" ]]; then LIBSECRET="\
      https://rpmfind.net/linux/centos/8-stream/BaseOS/aarch64/os/Packages/libsecret-devel-0.18.6-1.el8.aarch64.rpm \
      libsecret"; \
    else \
      LIBSECRET=""; echo "Warning: arch $(uname -m) not supported"; \
    fi; } \
    && yum install -y $LIBSECRET curl make cmake gcc gcc-c++ python2 git git-core-doc openssh less libX11-devel libxkbcommon bash tar gzip rsync patch \
    && yum -y clean all && rm -rf /var/cache/yum \
    && npm install -g yarn@1.22.17
COPY code /checode-compilation
WORKDIR /checode-compilation
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Initialize a git repository for code build tools
RUN git init .

# change network timeout (slow using multi-arch build)
RUN yarn config set network-timeout 600000 -g

# Grab dependencies (and force to rebuild them)
RUN yarn install --force

# Compile
RUN NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat /checode-compilation/remote/.yarnrc | grep target | cut -d ' ' -f 2 | tr -d '"') \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node" \
    && cp /usr/bin/node /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node \
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

### Testing
# Compile tests
RUN ./node_modules/.bin/gulp compile-extension:vscode-api-tests \
	compile-extension:markdown-language-features \
	compile-extension:typescript-language-features \
	compile-extension:emmet \
	compile-extension:git \
	compile-extension:ipynb \
	compile-extension-media \
  compile-extension:configuration-editing

# Compile test suites
# https://github.com/microsoft/vscode/blob/cdde5bedbf3ed88f93b5090bb3ed9ef2deb7a1b4/test/integration/browser/README.md#compile
RUN [[ $(uname -m) == "x86_64" ]] && yarn --cwd test/smoke compile && yarn --cwd test/integration/browser compile

# install test dependencies
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
RUN [[ $(uname -m) == "x86_64" ]] &&  yarn playwright-install 
# Install procps to manage to kill processes and centos stream repository
RUN [[ $(uname -m) == "x86_64" ]] && \
    ARCH=$(uname -m) && \
    yum install --nobest -y procps \
        http://mirror.centos.org/centos/8/extras/${ARCH}/os/Packages/epel-release-8-11.el8.noarch.rpm \
        http://mirror.centos.org/centos/8-stream/BaseOS/${ARCH}/os/Packages/centos-gpg-keys-8-3.el8.noarch.rpm \
        http://mirror.centos.org/centos/8-stream/BaseOS/${ARCH}/os/Packages/centos-stream-repos-8-3.el8.noarch.rpm

RUN [[ $(uname -m) == "x86_64" ]] && yum install -y chromium && \
    PLAYWRIGHT_CHROMIUM_PATH=$(echo /opt/app-root/src/.cache/ms-playwright/chromium-*/) && \
    rm "${PLAYWRIGHT_CHROMIUM_PATH}/chrome-linux/chrome" && \
    ln -s /usr/bin/chromium-browser "${PLAYWRIGHT_CHROMIUM_PATH}/chrome-linux/chrome"

# use of retry and timeout
COPY /build/scripts/helper/retry.sh /opt/app-root/src/retry.sh
RUN chmod u+x /opt/app-root/src/retry.sh

# Run integration tests (Browser)
RUN [[ $(uname -m) == "x86_64" ]] && NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    VSCODE_REMOTE_SERVER_PATH="$(pwd)/../vscode-reh-web-linux-${NODE_ARCH}" \
    /opt/app-root/src/retry.sh -v -t 3 -s 2 -- timeout -v 5m ./scripts/test-web-integration.sh --browser chromium

# Run smoke tests (Browser)
RUN [[ $(uname -m) == "x86_64" ]] && NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    VSCODE_REMOTE_SERVER_PATH="$(pwd)/../vscode-reh-web-linux-${NODE_ARCH}" \
    /opt/app-root/src/retry.sh -v -t 3 -s 2 -- timeout -v 5m yarn smoketest-no-compile --web --headless --electronArgs="--disable-dev-shm-usage --use-gl=swiftshader"

# Store the content of the result
FROM scratch as linux-libc-content
COPY --from=linux-libc-builder /checode /checode-linux-libc
