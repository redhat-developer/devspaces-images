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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.15.7-11 as builder
ENV GOPATH=/go/
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
ENV SUMMARY="Red Hat CodeReady Workspaces machineexec container" \
    DESCRIPTION="Red Hat CodeReady Workspaces machineexec container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="machineexec-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.10" \
      license="EPLv2" \
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""


# insert generated LABELs below this line
LABEL \
			jenkins.build.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/303/" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/303/artifact/**/codeready-workspaces-sleep-x86_64.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/303/artifact/**/codeready-workspaces-sleep-s390x.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/303/artifact/**/codeready-workspaces-sleep-ppc64le.tar.gz" \
			jenkins.build.number="303"
