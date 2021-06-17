# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM registry.access.redhat.com/ubi8-minimal:8.4 as builder
# shadow-utils is needed to install `adduser` tool
RUN microdnf install -y golang shadow-utils && \
    go version

USER root
WORKDIR /che-machine-exec/
COPY . .
RUN adduser unprivilegeduser && \
    # Arch-specific version of sleep binary can be found in quay.io/crw/imagepuller-rhel8 as of 2.9-4 (or newer tag)
    # see https://github.com/redhat-developer/codeready-workspaces-deprecated/tree/crw-2-rhel-8/sleep/build.sh to fetch single-arch locally
    # see https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/job/crw-deprecated_2.x/ to build multi-arch tarballs that can then be used in Brew
    # see https://github.com/redhat-developer/codeready-workspaces-images/blob/crw-2-rhel-8/codeready-workspaces-machineexec/get-sources-jenkins.sh#L48-L50 to fetch tarballs, commit them and use in Brew
    if [[ -f codeready-workspaces-sleep-$(uname -m).tar.gz ]]; then tar xzf codeready-workspaces-sleep-$(uname -m).tar.gz; fi; \
    CGO_ENABLED=0 GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o che-machine-exec . && \
    mkdir -p /rootfs/tmp /rootfs/etc /rootfs/go/bin && \
    # In the `scratch` you can't use Dockerfile#RUN, because there is no shell and no standard commands (mkdir and so on).
    # That's why prepare absent `/tmp` folder for scratch image
    chmod 1777 /rootfs/tmp && \
    cp -rf /etc/passwd /rootfs/etc && \
    cp -rf /che-machine-exec/che-machine-exec /rootfs/go/bin

FROM scratch

COPY --from=builder /rootfs /
COPY --from=builder /che-machine-exec/sleep /bin/sleep

USER unprivilegeduser
ENTRYPOINT ["/go/bin/che-machine-exec"]

# append Brew metadata here
