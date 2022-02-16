# Copyright (c) 2020-2021 Red Hat, Inc.
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
ENV SUMMARY="Red Hat CodeReady Workspaces operator-bundle container" \
    DESCRIPTION="Red Hat CodeReady Workspaces operator-bundle container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="operator-bundle"
LABEL operators.operatorframework.io.bundle.mediatype.v1=registry+v1 \
      operators.operatorframework.io.bundle.manifests.v1=manifests/ \
      operators.operatorframework.io.bundle.metadata.v1=metadata/ \
      operators.operatorframework.io.bundle.package.v1=codeready-workspaces2 \
      operators.operatorframework.io.bundle.channels.v1=tech-preview-latest-all-namespaces \
      operators.operatorframework.io.bundle.channel.default.v1=tech-preview-latest-all-namespaces \
      com.redhat.delivery.operator.bundle="true" \
      com.redhat.openshift.versions="v4.8-v4.9" \
      com.redhat.delivery.backport=false \
      summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.15" \
      license="EPLv2" \
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
