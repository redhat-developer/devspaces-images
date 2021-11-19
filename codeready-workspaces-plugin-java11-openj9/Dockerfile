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
FROM ubi8-minimal:8.5-204

USER root

ENV \
    GRADLE_VERSION="6.1" \
    MAVEN_VERSION="3.6.3" \
    LOMBOK_VERSION="1.18.22" \
    JAVA_HOME=/usr/lib/jvm/ibm-semeru-open-11-jdk \
    PATH="/usr/lib/jvm/ibm-semeru-open-11-jdk:/opt/gradle/bin:/opt/apache-maven/bin:/usr/bin:${PATH:-/bin:/usr/bin}" \
    MANPATH="/usr/share/man:${MANPATH}" \
    JAVACONFDIRS="/etc/java${JAVACONFDIRS:+:}${JAVACONFDIRS:-}" \
    XDG_CONFIG_DIRS="/etc/xdg:${XDG_CONFIG_DIRS:-/etc/xdg}" \
    XDG_DATA_DIRS="/usr/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}" \
    M2_HOME="/opt/apache-maven" \
    HOME="/home/jboss"

# contains 3rd party binaries
# run './get-sources-jenkins.sh --force-pull --nobuild' to generate this file, or 
# use 'rhpkg sources' to fetch existing version from dist-git.
COPY gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz /tmp/
COPY lombok-${LOMBOK_VERSION}.jar /lombok.jar

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io
# COPY content_sets.repo /etc/yum.repos.d/

# For OpenShift Client 4 (oc): rhocp-4.9-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.9/os/Packages/o/openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8.ppc64le.rpm
# For local build: find latest rpm at https://brewweb.engineering.redhat.com/brew/packageinfo?packageID=73631
#                  and microdnf install yum && yum localinstall http://download.eng.bos.redhat.com/brewroot/vol/rhel-8/packages/ibm-semeru-open-11-jdk/11.0.12.7_0.27.1/1.el8j9/$(uname -m)/ibm-semeru-open-11-jdk-11.0.12.7_0.27.1-1.el8j9.$(uname -m).rpm  
RUN microdnf install -y bash tar gzip unzip which shadow-utils findutils wget curl openshift-clients-4.9.0-202109101042.p0.git.96e95ce.assembly.stream.el8 \
    ibm-semeru-open-11-jdk \
    # we might not need all of this?
    sudo git procps-ng nss_wrapper bzip2 yum && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
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
    mkdir -p /opt; unzip -d /opt /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    mv /opt/gradle-${GRADLE_VERSION} /opt/gradle && rm -f /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    tar xzf /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt && \
    mv /opt/apache-maven-${MAVEN_VERSION} /opt/apache-maven && \
    rm -f /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz && \
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
ENV SUMMARY="Red Hat CodeReady Workspaces - Eclipse OpenJ9 11 plugin container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - Eclipse OpenJ9 11 plugin container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="plugin-java11-openj9-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
