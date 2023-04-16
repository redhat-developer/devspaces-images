# Copyright (c) 2018-2023 Red Hat, Inc.
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
FROM ubi8-minimal:8.7-1107
USER root
ENV CHE_HOME=/home/user/devspaces
ENV JAVA_HOME=/usr/lib/jvm/jre
RUN microdnf install java-11-openjdk-headless tar gzip shadow-utils findutils && \
    microdnf update -y && \
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    adduser -G root user && mkdir -p /home/user/devspaces
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# see fetch-artifacts-pnc.yaml
COPY artifacts/assembly-main.tar.gz /tmp/assembly-main.tar.gz
RUN tar xzf /tmp/assembly-main.tar.gz --strip-components=1 -C /home/user/devspaces; rm -f /tmp/assembly-main.tar.gz

# this should fail if the startup script is not found in correct path /home/user/devspaces/tomcat/bin/catalina.sh
RUN mkdir /logs /data && \
    chmod 0777 /logs /data && \
    chgrp -R 0 /home/user /logs /data && \
    chown -R user /home/user && \
    chmod -R g+rwX /home/user && \
    find /home/user -type d -exec chmod 777 {} \; && \
    java -version && echo -n "Server startup script in: " && \
    find /home/user/devspaces -name catalina.sh | grep -z /home/user/devspaces/tomcat/bin/catalina.sh

USER user

# append Brew metadata here
ENV SUMMARY="Red Hat OpenShift Dev Spaces server container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces server container" \
    PRODNAME="devspaces" \
    COMPNAME="server-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.7" \
      pnc_artifact_id="10145404" \
      pnc_build_id="AYFLJ4WI6LYAA" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
