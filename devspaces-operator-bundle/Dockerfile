# Copyright (c) 2020-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# metadata images built in brew must be from scratch
# https://docs.engineering.redhat.com/display/CFC/Migration
FROM scratch

COPY manifests /manifests/
COPY metadata /metadata/

# append Brew metadata here 
ENV SUMMARY="Red Hat OpenShift Dev Spaces operator-bundle container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces operator-bundle container" \
    PRODNAME="devspaces" \
    COMPNAME="operator-bundle"
# https://access.redhat.com/support/policy/updates/openshift#dates
# support for 4.12 ends on January 17, 2025
# support for 4.11 ends on February 10, 2024
LABEL operators.operatorframework.io.bundle.mediatype.v1=registry+v1 \
      operators.operatorframework.io.bundle.manifests.v1=manifests/ \
      operators.operatorframework.io.bundle.metadata.v1=metadata/ \
      operators.operatorframework.io.bundle.package.v1=devspaces \
      operators.operatorframework.io.bundle.channels.v1=stable \
      operators.operatorframework.io.bundle.channel.default.v1=stable \
      com.redhat.delivery.operator.bundle="true" \
      com.redhat.openshift.versions="v4.11" \
      com.redhat.delivery.backport=false \
      summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.10" \
      license="EPLv2" \
      maintainer="Anatolii Bazko <abazko@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>, Samantha Dawley <sdawley@redhat.com>,  Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
