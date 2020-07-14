# Copyright (c) 2020 Red Hat, Inc.
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
FROM ubi8-minimal:8.2-301.1593113563

USER root

ENV \
    GRADLE_VERSION="6.1" \
    MAVEN_VERSION="3.6.3" \
    JAVA_HOME=/usr/lib/jvm/java-11-openjdk \
    PATH="/usr/lib/jvm/java-11-openjdk:/opt/gradle/bin:/opt/apache-maven/bin:/usr/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/opt/apache-maven" \
    HOME="/home/jboss"

# contains 3rd party binaries
# run './get-sources-jenkins.sh --force-pull --nobuild' to generate this file, or 
# use 'rhpkg sources' to fetch existing version from dist-git.
COPY gradle.tgz maven.tgz /tmp/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io
# COPY content_sets.repo /etc/yum.repos.d/
# NOTE: openshift-clients comes from OSE content set
RUN microdnf install -y bash tar gzip which shadow-utils findutils wget curl openshift-clients-4.3.19 \
    java-11-openjdk java-11-openjdk-devel java-11-openjdk-src java-11-openjdk-headless \
    # we might not need all of this?
    sudo git procps-ng nss_wrapper bzip2 && \
    microdnf update -y sqlite libarchive systemd && \
    microdnf clean all && rm -rf /var/cache/yum && \
    mkdir -p /projects && \
    # add jboss user and configure it
    useradd -u 1000 -G wheel,root -d /home/jboss --shell /bin/bash -m jboss && \
    mkdir -p /home/jboss && cat /etc/passwd | \
    sed s#jboss:x.*#jboss:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > /home/jboss/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > /home/jboss/group.template && \
    echo "jboss	ALL=(ALL)	NOPASSWD: ALL" >> /etc/sudoers && \
    # unpack gradle into /opt/gradle/, and maven into /opt/apache-maven/
    mkdir -p /opt; tar xzf /tmp/gradle.tgz -C /opt/ && tar xzf /tmp/maven.tgz -C /opt/ && rm -fr /tmp/*.tgz && \
    # fix permissions in bin/* files
    for d in $(find /opt/gradle /opt/apache-maven -name bin -type d); do echo $d; chmod +x $d/*; done && \
    for f in "/home/jboss" "/etc/passwd" "/etc/group" "/projects"; do \
      chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" && \
    echo "========" && \
    mvn -v && \
    java -version && \
    echo "========" && \
    gradle -v && \
    echo "========"

ADD entrypoint.sh ${HOME}/
RUN chmod +x ${HOME}/*.sh

USER jboss
ENTRYPOINT ["/home/jboss/entrypoint.sh"]
WORKDIR /projects
CMD tail -f /dev/null

# append Brew metadata here
ENV SUMMARY="Red Hat CodeReady Workspaces - Java 11 plugin container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Java 11 plugin container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="plugin-java11-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.3" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
