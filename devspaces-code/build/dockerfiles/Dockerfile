# Copyright (c) 2022-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://quay.io/devspaces/machineexec-rhel8
FROM quay.io/devspaces/machineexec-rhel8:3.12 as machine-exec

##################################################################################################################
#
# Prepare ubi8-based assembly of VS Code
#
##################################################################################################################

# https://registry.access.redhat.com/ubi8/nodejs-20
FROM registry.access.redhat.com/ubi8/nodejs-20:1-64 as linux-libc-ubi8-builder

USER root

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi

# Enable pulp content sets to resolve libsecret & libxkbfile as rpm
COPY ./build/dockerfiles/content_sets_pulp.repo /etc/yum.repos.d/

RUN yum install -y nodejs-devel libsecret-devel libsecret make cmake gcc gcc-c++ python3.9 git git-core-doc openssh less libX11-devel libxkbfile-devel libxkbfile libxkbcommon bash tar gzip rsync patch \
    && yum -y clean all && rm -rf /var/cache/yum

# Copy VS Code to the container
COPY code /checode-compilation
WORKDIR /checode-compilation
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    # workaround for https://github.com/nodejs/node/issues/51555
    DISABLE_V8_COMPILE_CACHE=1

# Initialize a git repository for code build tools
RUN git init .

# change network timeout (slow using multi-arch build)
RUN npm config set fetch-retry-mintimeout 1000000 && npm config set fetch-retry-maxtimeout 600000

# Grab dependencies (and force to rebuild them)
RUN npm install --force

RUN echo "$(ulimit -a)"

# Compile
RUN NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat /checode-compilation/remote/.npmrc | grep target | cut -d '=' -f 2 | tr -d '"') \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node" \
    && cp /usr/bin/node /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node \
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

# Copy VS Code launcher to the container
COPY launcher /checode-launcher
WORKDIR /checode-launcher
RUN npm install \
    && mkdir /checode/launcher \
    && cp -r out/src/*.js /checode/launcher \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

##################################################################################################################
#
# Prepare ubi9-based assembly of VS Code
#
##################################################################################################################

# https://registry.access.redhat.com/ubi9/nodejs-20
FROM registry.access.redhat.com/ubi9/nodejs-20:1-59.1726696138 as linux-libc-ubi9-builder

USER root

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi

# Enable pulp content sets to resolve libsecret & libxkbfile as rpm
COPY ./build/dockerfiles/content_sets_pulp.repo /etc/yum.repos.d/

RUN echo "Repo list is: $(dnf repolist)" && \
    echo "Disabling rhel-8 based repos..." && \
    dnf config-manager --set-disabled 'rhel-8*' && \
    echo "Repo list after disabling rhel-8 based repos is: $(dnf repolist)" && \
    echo "$(dnf module list nodejs)"

# Enable rhel-9 repo to resolve libsecret & libxkbfile as rpm
RUN \
    dnf install -y \
    --enablerepo=rhel-9-for-baseos-rpms-pulp \
    --enablerepo=rhel-9-for-appstream-rpms-pulp \
    --enablerepo=rhel-9-for-codeready-builder-rpms-pulp \
    nodejs-devel libsecret-devel libsecret krb5-devel make cmake gcc gcc-c++ git git-core-doc \
    openssh less libX11-devel libxkbfile-devel libxkbfile libxkbcommon  bash tar gzip rsync patch npm \
    && dnf -y clean all && rm -rf /var/cache/dnf

# Copy VS Code to the container
COPY code /checode-compilation
WORKDIR /checode-compilation
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    # workaround for https://github.com/nodejs/node/issues/51555
    DISABLE_V8_COMPILE_CACHE=1

# Initialize a git repository for code build tools
RUN git init .

# change network timeout (slow using multi-arch build)
RUN npm config set fetch-retry-mintimeout 1000000 && npm config set fetch-retry-maxtimeout 600000

# Grab dependencies (and force to rebuild them)
RUN npm install --force

RUN NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat /checode-compilation/remote/.npmrc | grep target | cut -d '=' -f 2 | tr -d '"') \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node" \
    && cp /usr/bin/node /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node \
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode \
    # cache libbrotli from this image to provide it to a user's container
    && mkdir -p /checode/ld_libs && find /usr/lib64 -name 'libbrotli*' 2>/dev/null | xargs -I {} cp -t /checode/ld_libs {}

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode


# Copy VS Code launcher to the container
COPY launcher /checode-launcher
WORKDIR /checode-launcher
RUN npm install \
    && mkdir /checode/launcher \
    && cp -r out/src/*.js /checode/launcher \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

# https://registry.access.redhat.com/ubi8/ubi
FROM registry.access.redhat.com/ubi8/ubi:8.10-1088 AS ubi-builder

RUN mkdir -p /mnt/rootfs
RUN yum install --installroot /mnt/rootfs brotli libstdc++ coreutils glibc-minimal-langpack --releasever 8 --setopt install_weak_deps=false --nodocs -y && yum --installroot /mnt/rootfs clean all
RUN rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

WORKDIR /mnt/rootfs

COPY --from=linux-libc-ubi8-builder --chown=0:0 /checode /mnt/rootfs/checode-linux-libc/ubi8
COPY --from=linux-libc-ubi9-builder --chown=0:0 /checode /mnt/rootfs/checode-linux-libc/ubi9

RUN mkdir -p /mnt/rootfs/projects && mkdir -p /mnt/rootfs/home/che && mkdir -p /mnt/rootfs/bin/
RUN cat /mnt/rootfs/etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /mnt/rootfs/home/che/.passwd.template \
    && cat /mnt/rootfs/etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /mnt/rootfs/home/che/.group.template
RUN for f in "/mnt/rootfs/bin/" "/mnt/rootfs/home/che" "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/projects" ; do\
           chgrp -R 0 ${f} && \
           chmod -R g+rwX ${f}; \
       done

COPY --from=machine-exec --chown=0:0 /go/bin/che-machine-exec /mnt/rootfs/bin/machine-exec
COPY --chmod=755 /build/scripts/*.sh /mnt/rootfs/
COPY --chmod=755 /build/remote-config /mnt/rootfs/remote/data/Machine/

##################################################################################################################
#
# Create all-in-one image
#
##################################################################################################################

# https://registry.access.redhat.com/ubi8-minimal
FROM registry.access.redhat.com/ubi8-minimal:8.10-1086
COPY --from=ubi-builder /mnt/rootfs/ /
ENV HOME=/home/che
USER 1001
ENTRYPOINT /entrypoint.sh
