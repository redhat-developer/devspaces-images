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

# https://registry.access.redhat.com/ubi8/go-toolset
FROM registry.redhat.io/rhel9-2-els/rhel:9.2-1222 as builder
ENV GOPATH=/go/ \
    CGO_ENABLED=1
USER root
WORKDIR /che-machine-exec/
COPY . .
# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
RUN dnf -y install golang && \
    adduser unprivilegeduser && \
    GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o che-machine-exec . && \
    mkdir -p /rootfs/tmp /rootfs/etc /rootfs/go/bin && \
    # In the `scratch` you can't use Dockerfile#RUN, because there is no shell and no standard commands (mkdir and so on).
    # That's why prepare absent `/tmp` folder for scratch image
    chmod 1777 /rootfs/tmp && \
    cp -rf /etc/passwd /rootfs/etc && \
    cp -rf /che-machine-exec/che-machine-exec /rootfs/go/bin

# https://registry.access.redhat.com/ubi8-minimal
FROM registry.redhat.io/rhel9-2-els/rhel:9.2-1222 as runtime
COPY --from=builder /rootfs /
RUN dnf install -y openssl && \
    dnf -y update && \
    dnf clean -y all

USER unprivilegeduser
ENTRYPOINT ["/go/bin/che-machine-exec"]

# append Brew metadata here
