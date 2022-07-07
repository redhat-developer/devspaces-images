# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8
FROM ubi8:8.6-855 as ubi-builder

RUN mkdir -p /mnt/rootfs/projects /mnt/rootfs/home/che
RUN yum install --installroot /mnt/rootfs tar gzip brotli libstdc++ coreutils glibc-minimal-langpack --releasever 8 --setopt install_weak_deps=false --nodocs -y && yum --installroot /mnt/rootfs clean all
RUN rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

WORKDIR /mnt/rootfs

RUN cat /mnt/rootfs/etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /mnt/rootfs/home/che/.passwd.template \
    && cat /mnt/rootfs/etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /mnt/rootfs/home/che/.group.template

COPY /build/scripts/entrypoint*.sh /mnt/rootfs/
COPY asset-*.tar.gz /tmp/assets/

RUN for f in /tmp/assets/*.tar.gz; do tar -xf "$f" -C /mnt/rootfs; done && \
    mv /mnt/rootfs/che-machine-exec /mnt/rootfs/bin/machine-exec

RUN for f in "/mnt/rootfs/bin/" "/mnt/rootfs/home/che" "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/projects" "/mnt/rootfs/entrypoint*.sh" "/mnt/rootfs/checode-linux-libc" ; do\
           chgrp -R 0 ${f} && \
           chmod -R g+rwX ${f}; \
       done

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.6-854
COPY --from=ubi-builder /mnt/rootfs/ /
ENV HOME=/home/che
USER 1001
ENTRYPOINT /entrypoint.sh

ENV SUMMARY="Red Hat OpenShift Dev Spaces - Visual Studio Code - Open Source IDE container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces - Visual Studio Code - Open Source IDE container" \
    PRODNAME="devspaces" \
    COMPNAME="code-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.2" \
      license="EPLv2" \
      maintainer="Roman Nikitenko <rnikiten@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
