# Copyright (c) 2021-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM ubi8/nodejs-18:1-81 as builder
# hadolint ignore=DL3002
USER 0
RUN dnf -y -q update --exclude=unbound-libs 
# https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources%28Cachito,ContainerFirst%29-CachitoIntegrationforyarn
# CRW-4644 Use RedHat nodejs headers to prevent node-gyp from trying to download them
# hadolint ignore=DL3040,DL3059
RUN dnf module install -y nodejs:18/development

# cachito:yarn step 1: copy cachito sources where we can use them; source env vars; set working dir
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
# hadolint ignore=SC1091
RUN source "$REMOTE_SOURCES_DIR"/devspaces-images-dashboard/cachito.env
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
COPY .yarn/releases $REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/.yarn/releases/
RUN ln -s "$REMOTE_SOURCES_DIR"/devspaces-images-dashboard/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn

# cachito:yarn step 3: configure yarn & install deps
# see https://source.redhat.com/groups/public/container-build-system/container_build_system_wiki/containers_from_source_multistage_builds_in_osbs#jive_content_id_Cachito_Integration_for_yarn
RUN yarn config set nodedir /usr; yarn config set unsafe-perm true && yarn install

# cachito:yarn step 4: lerna installed to $REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/node_modules/.bin/lerna - add to path
RUN ln -s "$REMOTE_SOURCES_DIR"/devspaces-images-dashboard/app/devspaces-dashboard/node_modules/.bin/lerna /usr/local/bin/lerna

# cachito:yarn step 5: the actual build!
# hadolint ignore=DL3059
RUN yarn build

# cachito:yarn step 6: cleanup (required only if not using a builder stage)
# RUN rm -rf $REMOTE_SOURCES_DIR

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM ubi8/nodejs-18:1-81
# hadolint ignore=DL3002
USER 0
# hadolint ignore=DL4006
RUN \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ENV FRONTEND_LIB=$REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/packages/dashboard-frontend/lib/public
ENV BACKEND_LIB=$REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/packages/dashboard-backend/lib
ENV DEVFILE_REGISTRY=$REMOTE_SOURCES_DIR/devspaces-images-dashboard/app/devspaces-dashboard/packages/devfile-registry

COPY --from=builder ${BACKEND_LIB} /backend
COPY --from=builder ${FRONTEND_LIB} /public
COPY --from=builder ${DEVFILE_REGISTRY} /public/dashboard/devfile-registry

COPY build/dockerfiles/rhel.entrypoint.sh /usr/local/bin
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

## Append Brew metadata
ENV SUMMARY="Red Hat OpenShift Dev Spaces dashboard container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces dashboard container" \
    PRODNAME="devspaces" \
    COMPNAME="dashboard-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.10" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
