# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

#########################################################################
############################# BUILD 1: libc #############################
#########################################################################

# https://catalog.redhat.com/software/containers/ubi8/nodejs-16/615aee9fc739c0a4123a87e1?container-tabs=overview
FROM registry.access.redhat.com/ubi8/nodejs-16:1-37.1652296488 as checode-linux-libc-builder
USER root

# # Export GITHUB_TOKEN into environment variable
# ARG GITHUB_TOKEN=''
# ENV GITHUB_TOKEN=$GITHUB_TOKEN
# # Unset GITHUB_TOKEN environment variable if it is empty.
# # This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# # For example, vscode ripgrep downloading is an example of such case.
# RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi

RUN yum install -y libsecret-devel libsecret curl make cmake gcc gcc-c++ python2 git git-core-doc openssh less libX11-devel libxkbcommon bash tar gzip rsync patch \
    && yum -y clean all && rm -rf /var/cache/yum

# cachito:yarn step 1: copy cachito sources where we can use them; source env vars; set working dir
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
RUN source $REMOTE_SOURCES_DIR/devspaces-images-code/cachito.env
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-code

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn 

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

# Compile
RUN NODE_ARCH=$(echo "console.log(process.arch)" | node) \
    && NODE_VERSION=$(cat /checode-compilation/remote/.yarnrc | grep target | cut -d ' ' -f 2 | tr -d '"') \
    # cache node from this image to avoid to grab it from within the build
    && mkdir -p /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH} \
    && echo "caching /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node" \
    && cp /usr/bin/node /checode-compilation/.build/node/v${NODE_VERSION}/linux-${NODE_ARCH}/node \
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp --tasks \
    && NODE_OPTIONS="--max_old_space_size=8500" ./node_modules/.bin/gulp vscode-reh-web-linux-${NODE_ARCH}-min \
    && cp -r ../vscode-reh-web-linux-${NODE_ARCH} /checode

RUN chmod a+x /checode/out/server-main.js \
    && chgrp -R 0 /checode && chmod -R g+rwX /checode

#########################################################################
############################# BUILD 2: machineexec#######################
#########################################################################

# NOTE: can't use scatch images in OSBS, because unable to start container process: exec: \"/bin/sh\": stat /bin/sh: no such file or directory
# so we must rebuild machineexec binary in this build
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.18.4-8 as machineexec-builder
ENV GOPATH=/go/
USER root

# cachito step 0: copy cachito sources where we can use them; set working dir
# because no pkg manager, no env vars to source
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-machineexec
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o che-machine-exec . && \
    mkdir -p /rootfs/go/bin && cp -rf $REMOTE_SOURCES_DIR/devspaces-images-code/app/devspaces-machineexec/che-machine-exec /rootfs/go/bin

#########################################################################
############################# BUILD 3: rootfs assembly ##################
#########################################################################

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8
FROM ubi8:8.7-1026 as ubi-builder

RUN mkdir -p /mnt/rootfs/projects /mnt/rootfs/home/che
RUN yum install --installroot /mnt/rootfs tar gzip brotli libstdc++ coreutils glibc-minimal-langpack --releasever 8 --setopt install_weak_deps=false --nodocs -y && yum --installroot /mnt/rootfs clean all
RUN rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

WORKDIR /mnt/rootfs

RUN cat /mnt/rootfs/etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /mnt/rootfs/home/che/.passwd.template \
    && cat /mnt/rootfs/etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /mnt/rootfs/home/che/.group.template

COPY /build/scripts/entrypoint*.sh /mnt/rootfs/
COPY --from=checode-linux-libc-builder --chown=0:0 /checode /mnt/rootfs/checode-linux-libc
COPY --from=machineexec-builder --chown=0:0 /go/bin/che-machine-exec /mnt/rootfs/bin/machine-exec

RUN for f in "/mnt/rootfs/bin/" "/mnt/rootfs/home/che" "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/projects" "/mnt/rootfs/entrypoint*.sh" "/mnt/rootfs/checode-linux-libc" ; do\
           chgrp -R 0 ${f} && \
           chmod -R g+rwX ${f}; \
       done

RUN rm /mnt/rootfs/etc/hosts

#########################################################################
############################# BUILD 4: minimal final image ##############
#########################################################################

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.7-923.1669829893
COPY --from=ubi-builder /mnt/rootfs/ /
ENV HOME=/home/che
USER 1001
ENTRYPOINT /entrypoint.sh

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
      version="3.4" \
      license="EPLv2" \
      maintainer="Roman Nikitenko <rnikiten@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
