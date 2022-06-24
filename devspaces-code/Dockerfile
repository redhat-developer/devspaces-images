# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM registry.access.redhat.com/ubi8:8.6-754 as ubi-builder

RUN mkdir -p /mnt/rootfs
RUN yum install --installroot /mnt/rootfs tar gzip brotli libstdc++ coreutils glibc-minimal-langpack --releasever 8 --setopt install_weak_deps=false --nodocs -y && yum --installroot /mnt/rootfs clean all
RUN rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

WORKDIR /mnt/rootfs

RUN mkdir -p /mnt/rootfs/projects && mkdir -p /mnt/rootfs/home/che && mkdir -p /mnt/rootfs/bin/
RUN cat /mnt/rootfs/etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /mnt/rootfs/home/che/.passwd.template \
    && cat /mnt/rootfs/etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /mnt/rootfs/home/che/.group.template
RUN for f in "/mnt/rootfs/bin/" "/mnt/rootfs/home/che" "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/projects" ; do\
           chgrp -R 0 ${f} && \
           chmod -R g+rwX ${f}; \
       done

COPY asset-*.tar.gz /tmp/assets/

RUN tar -xf /tmp/assets/asset-machine-exec.tar.gz && \
    mv che-machine-exec /mnt/rootfs/bin/machine-exec && \
    chown 0:0 /mnt/rootfs/bin/machine-exec

RUN tar -xf /tmp/assets/asset-linux-libc.tar.gz -C /mnt/rootfs && \
    chown 0:0 /mnt/rootfs/checode-linux-libc

RUN tar -xf /tmp/assets/asset-entrypoints.tar.gz -C /mnt/rootfs && \
    chmod 755 /mnt/rootfs/entrypoint*.sh

FROM registry.access.redhat.com/ubi8-minimal:8.6-751
COPY --from=ubi-builder /mnt/rootfs/ /
ENV HOME=/home/che
USER 1001
ENTRYPOINT /entrypoint.sh

ENV SUMMARY="Red Hat OpenShift Dev Spaces code container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces code container" \
    PRODNAME="devspaces" \
    COMPNAME="code-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.1" \
      license="EPLv2" \
      maintainer="Roman Nikitenko <rnikiten@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
