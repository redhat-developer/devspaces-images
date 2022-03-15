# Copyright (c) 2019-21 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-theia-rhel8:2.16 as builder
ARG NEXE_SHA1=0f0869b292f1d7b68ba6e170d628de68a10c009f

WORKDIR /home/theia

# Apply node libs installed globally to the PATH
ENV PATH=${HOME}/.yarn/bin:${PATH}

# setup extra stuff
USER root
ENV YARN_FLAGS="--offline"
ENV NEXE_FLAGS="--target 'alpine-x64-12' --temp /tmp/nexe-cache"
COPY asset-theia-endpoint-runtime-pre-assembly-nexe-cache-*.tar.gz asset-theia-endpoint-runtime-binary-yarn-*.tar.gz asset-node-src.tar.gz /tmp/
RUN tar xzf /tmp/asset-theia-endpoint-runtime-binary-yarn-$(uname -m).tar.gz -C / && rm -f /tmp/asset-theia-endpoint-runtime-binary-yarn-*.tar.gz && \
    export NODE_VERSION=$(node --version | sed -s 's/v//') && mkdir -p "/home/theia/.nexe/${NODE_VERSION}" && \
    tar zxf /tmp/asset-node-src.tar.gz --strip-components=1 -C "/home/theia/.nexe/${NODE_VERSION}" && \
    rm -f /tmp/asset-node-src.tar.gz && \
    tar zxf /tmp/asset-theia-endpoint-runtime-pre-assembly-nexe-cache-$(uname -m).tar.gz -C "/tmp/" && \
    rm -f /tmp/asset-theia-endpoint-runtime-pre-assembly-nexe-cache-*.tar.gz 

RUN yum install -y git make cmake gcc gcc-c++ python2 automake autoconf which glibc-devel && \
    yum -y clean all && rm -rf /var/cache/yum && ln -s /usr/bin/python2 /usr/bin/python
# setup nexe
# install specific nexe
COPY asset-theia-endpoint-runtime-pre-assembly-nexe-*.tar.gz /tmp/
RUN tar zxf /tmp/asset-theia-endpoint-runtime-pre-assembly-nexe-$(uname -m).tar.gz -C "/tmp/" && \
    rm -f /tmp/asset-theia-endpoint-runtime-pre-assembly-nexe-*.tar.gz 
# Change back to root folder
WORKDIR /home/theia

RUN /tmp/nexe/index.js -v && \
    # Build remote binary with node runtime 14.x and che-theia node dependencies. nexe icludes to the binary only
    # necessary dependencies.
    eval /tmp/nexe/index.js -i node_modules/@eclipse-che/theia-remote/lib/node/plugin-remote.js ${NEXE_FLAGS} -o ${HOME}/plugin-remote-endpoint

# Light image without node. We include remote binary to this image.
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.5-240 as runtime
USER 0
RUN microdnf -y install yum python38 python38-pyyaml jq && python3 --version && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
# copy previously cached yq dependency wheels for offline install
COPY *.whl /tmp

ENV SUMMARY="Red Hat CodeReady Workspaces - theia-endpoint container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - theia-endpoint container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="theia-endpoint-rhel8" 

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

# Setup extra stuff
# install yq from local wheels we fetched earlier 
RUN pip3 --version && pip3 install /tmp/*.whl && yq --version && rm -fr /tmp/*.whl 

COPY --from=builder /home/theia/plugin-remote-endpoint /plugin-remote-endpoint

COPY src/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
