# Copyright (c) 2019-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# This container build creates configbump binary in a container
# see also brew.Dockerfile

# https://registry.access.redhat.com/ubi8-minimal
FROM registry.access.redhat.com/ubi8-minimal:8.8-1014

WORKDIR /app
COPY . ./

# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
ENV CGO_ENABLED=1 \
    PACKAGES_INSTALLED="shadow-utils golang openssl openssl-devel \
    autoconf automake cmake-filesystem crypto-policies-scripts gcc-c++ go-toolset libgcrypt-devel \
    libgpg-error-devel libstdc++-devel make redhat-rpm-config rpm-build-libs subscription-manager subscription-manager-rhsm-certificates"
# hadolint ignore=DL3041, DL4006, SC2086
RUN microdnf -y install ${PACKAGES_INSTALLED} && \
    adduser appuser && \
    export ARCH="$(uname -m)" && if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; fi && \
    go mod download && go mod verify && \
    go test -v  ./... && \
    GOOS=linux GOARCH=${ARCH} go build -a -ldflags '-w -s' -a -installsuffix cgo -o configbump cmd/configbump/main.go && \
    cp configbump /usr/local/bin/configbump && \
    chmod 755 /usr/local/bin/configbump && \
    rm -rf $REMOTE_SOURCES_DIR && \
    microdnf -y remove ${PACKAGES_INSTALLED} && \
    microdnf -y update || true && \
    microdnf -y clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
USER appuser

ENTRYPOINT ["/usr/local/bin/configbump"]
