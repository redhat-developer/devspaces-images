# Copyright (c) 2022-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://registry.access.redhat.com/ubi8/nodejs-16
FROM registry.access.redhat.com/ubi8/nodejs-16:1-105.1684740145 as builder

USER root

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# Enable pulp content sets to resolve libsecret & libxkbfile as rpm
COPY ./build/dockerfiles/content_sets_pulp.repo /etc/yum.repos.d/

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi

RUN yum -y -q update \
    && yum install -y libsecret-devel libsecret curl make cmake gcc gcc-c++ python2 git git-core-doc openssh less libX11-devel libxkbfile-devel libxkbfile libxkbcommon bash tar gzip rsync patch \
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

RUN echo "$(ulimit -a)"

ARG PLATFORM="linux"
ARG NODE_LOCATION="https://nodejs.org"

RUN { \ 
    if [[ $(uname -m) == "s390x" ]]; then \
      NODE_ARCH="s390x"; \
      BUILD_ARCH="s390x"; \
    elif [[ $(uname -m) == "ppc64le" ]]; then \ 
      NODE_ARCH="ppc64le"; \
      BUILD_ARCH="ppc64"; \
    elif [[ $(uname -m) == "x86_64" ]]; then \
      NODE_ARCH="x64"; \
      BUILD_ARCH="x64"; \
    elif [[ $(uname -m) == "aarch64" ]]; then \
      NODE_ARCH="arm64"; \
      BUILD_ARCH="arm64"; \
    else \
      NODE_ARCH=""; \
      BUILD_ARCH=$(echo "console.log(process.arch)" | node); \
    fi; \ 
    } \
    && NODE_VERSION=$(cat /checode-compilation/remote/.yarnrc | grep target | cut -d ' ' -f 2 | tr -d '"') \
    && { \
        if [ -n "$NODE_ARCH" ]; then \
            NODE_URL="${NODE_LOCATION}/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${NODE_ARCH}.tar.gz"; \
            echo "Downloading Node.js from ${NODE_URL}"; \
            wget -q "${NODE_URL}"; \
            tar -xf node-v${NODE_VERSION}-${PLATFORM}-${NODE_ARCH}.tar.gz; \
            mv node-v${NODE_VERSION}-${PLATFORM}-${NODE_ARCH} nodejs; \
        else mkdir -p nodejs/bin && cp /usr/bin/node nodejs/bin/node; \
        fi; \
       } \
    # cache node from this image to avoid to grab it within the build
    && CACHE_NODE_PATH=/checode-compilation/.build/node/v${NODE_VERSION}/${PLATFORM}-${BUILD_ARCH} \
    && mkdir -p $CACHE_NODE_PATH \
    && echo "caching ${CACHE_NODE_PATH}" \
    && cp nodejs/bin/node ${CACHE_NODE_PATH}/node \
    # compile assembly
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-${PLATFORM}-${BUILD_ARCH}-min \
    && cp -r ../vscode-reh-web-${PLATFORM}-${BUILD_ARCH} /checode

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

# https://registry.access.redhat.com/ubi8-minimal
FROM registry.access.redhat.com/ubi8-minimal:8.8-860
COPY --from=builder --chown=0:0 /checode /checode-linux-libc
