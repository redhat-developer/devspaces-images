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
FROM registry.access.redhat.com/ubi8-minimal:8.7-1085.1679482090

WORKDIR /app
COPY . ./

RUN microdnf -y install shadow-utils golang && \
    adduser appuser && \
    export ARCH="$(uname -m)" && if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; fi && \
    go mod download && go mod verify && \
    go test -v  ./... && \
    CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -ldflags '-w -s' -a -installsuffix cgo -o configbump cmd/configbump/main.go && \
    cp configbump /usr/local/bin/configbump && \
    chmod 755 /usr/local/bin/configbump && \
    rm -rf $REMOTE_SOURCES_DIR && \
    microdnf -y remove shadow-utils golang && \
    microdnf -y update || true && \
    microdnf -y clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
USER appuser

ENTRYPOINT ["/usr/local/bin/configbump"]
