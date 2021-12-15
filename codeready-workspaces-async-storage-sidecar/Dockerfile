# Copyright (c) 2019-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
# build go content
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.16.7-5 as builder
ENV GOPATH=/tmp/go/

USER root
RUN adduser appuser

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

WORKDIR $REMOTE_SOURCES_DIR/supercronic/app

RUN source $REMOTE_SOURCES_DIR/supercronic/cachito.env   && make build

WORKDIR /workspace-data-sync

COPY . .

# Make "vendoring" of github.com/gorilla/websocket dependency
RUN mkdir -p vendor/github.com/gorilla/websocket  && cp -rT $REMOTE_SOURCES_DIR/websocket/app vendor/github.com/gorilla/websocket  && go build -mod vendor -o ./dockerfiles/sidecar/scripts/watcher ./watcher/watcher.go


# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.5-204
COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/scripts/watcher /watcher 
COPY --from=builder $REMOTE_SOURCES_DIR/supercronic/app/supercronic /supercronic

ENV USER=user \
    UID=12345 \
    GROUP=group \
    GID=23456


#cron task not work in openshift in case https://github.com/gliderlabs/docker-alpine/issues/381
#so will used  supercronic https://github.com/aptible/supercronic
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.1.9/supercronic-linux-amd64 \
    SUPERCRONIC=supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=5ddf8ea26b56d4a7ff6faecdd8966610d5cb9d85

COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/cron/backup-cron-job /etc/crontabs/backup-cron-job
COPY --from=builder /workspace-data-sync/dockerfiles/sidecar/s/scripts /scripts
#
# Add user that will be able to start watcher binary but nothing more
# the result will be propagated then into scratch image
# See https://stackoverflow.com/a/55757473/12429735RUN
#
RUN microdnf update -y \ 
      && microdnf install -y \
      shadow-utils \
      rsync \
      curl \
      openssh \
      openssh-clients \
      ca-certificates \
      && microdnf clean all \
      && rm -rf /var/cache/yum \
         && useradd $USER \
      && mkdir  /var/run/sshd && \
      # Change permissions to let any arbitrary user
      for f in  "/etc/passwd" "/var/run/sshd" "/scripts"; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
      done  \
      && update-ca-trust \
      && chmod +x "/supercronic" && mv "/supercronic" "/usr/local/bin/supercronic" 
  
      # change permissions 
      && chmod +x /scripts/* \
      && chmod 0644 /etc/crontabs/backup-cron-job \
      && sed -i s/root:!/"root:*"/g /etc/shadow

EXPOSE 4445
ENTRYPOINT [ "/scripts/entrypoint.sh" ]
ENV SUMMARY="Red Hat CodeReady Workspaces async-storage-sidecar container" \
    DESCRIPTION="Red Hat CodeReady Workspaces async-storage-sidecar container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="async-storage-sidecar-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.15" \
      license="EPLv2" \
      maintainer="Mykhailo Kuznietsov <mkuznets@redhat.com>, Ilya Buziuk <ibuziuk@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
