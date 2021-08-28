# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/php-74
FROM ubi8/php-74:1-35

ENV SUMMARY="Red Hat CodeReady Workspaces - PHP Stack container" \
    DESCRIPTION="Red Hat CodeReady Workspaces - PHP Stack container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="stacks-php-rhel8" \
    HOME=/home/jboss

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.12" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""

USER root

# built in Brew, use get-sources-jenkins.sh to pull latest
COPY . /tmp/assets/

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# COPY content_sets.repo /etc/yum.repos.d/

# new for CRW 2
RUN dnf install -y php-fpm php-opcache php-devel php-pear php-gd php-mysqli php-zlib php-curl ca-certificates && \
    tar xzf /tmp/assets/codeready-workspaces-stacks-language-servers-dependencies-php-xdebug-$(uname -m).tar.gz -C / 

# For OpenShift Client 4 (oc): rhocp-4.8-for-rhel-8-x86_64-rpms
# must hard code a version because otherwise we fail with
## Failed component comparison for components: openshift-clients
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/x86_64/rhocp/4.8/os/Packages/o/openshift-clients-4.8.0-202108061819.p0.git.c6ad8ac.assembly.stream.el8.x86_64.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/s390x/rhocp/4.8/os/Packages/o/openshift-clients-4.8.0-202108061819.p0.git.c6ad8ac.assembly.stream.el8.s390x.rpm
# http://rhsm-pulp.corp.redhat.com/content/dist/layered/rhel8/ppc64le/rhocp/4.8/os/Packages/o/openshift-clients-4.8.0-202108061819.p0.git.c6ad8ac.assembly.stream.el8.ppc64le.rpm
RUN useradd -u 1000 -G wheel,root -d ${HOME} --shell /bin/bash -m jboss && \
    yum remove -y nodejs kernel-headers && \
    yum install -y sudo openshift-clients-4.8.0-202108061819.p0.git.c6ad8ac.assembly.stream.el8 && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    mkdir -p ${HOME}/che /projects && \
    cat /etc/passwd | \
    sed s#jboss:x.*#jboss:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g \
    > ${HOME}/passwd.template && \
    cat /etc/group | \
    sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g \
    > ${HOME}/group.template && \
    echo "jboss ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers && \
    sed -i 's/opt\/app-root\/src/projects/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/#DocumentRoot/DocumentRoot/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/CustomLog \"|\/usr\/bin\/cat\"/CustomLog \"\/var\/log\/httpd\/access_log\"/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/ErrorLog \"|\/usr\/bin\/cat\"/ErrorLog \"\/var\/log\/httpd\/error_log\"/' /etc/httpd/conf/httpd.conf && \
    chmod -R 777 /var/run/httpd /var/log/httpd/ /etc/pki/ /etc/httpd/logs/

RUN mkdir -p ${HOME}/che/ls-php/php-language-server && \
    tar xzf /tmp/assets/codeready-workspaces-stacks-language-servers-dependencies-php-$(uname -m).tar.gz -C ${HOME}/che/ls-php/php-language-server/ && \
    cp ${HOME}/che/ls-php/php-language-server/composer/composer /usr/bin/composer && \
    rm -fr /tmp/assets/

RUN for f in "${HOME}" "/etc/passwd" "/etc/group" "/projects"; do \
      chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
ADD entrypoint.sh ${HOME}/entrypoint.sh

USER jboss
ENTRYPOINT ["/home/jboss/entrypoint.sh"]
WORKDIR /projects
CMD tail -f /dev/null


# insert generated LABELs below this line
LABEL \
			jenkins.build.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-x86_64.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-xdebug-x86_64.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-s390x.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-xdebug-s390x.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-ppc64le.tar.gz" \
			jenkins.artifact.url="https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/view/CRW_CI/view/Pipelines/job/crw-deprecated_2.x/1174/artifact/**/codeready-workspaces-stacks-language-servers-dependencies-php-xdebug-ppc64le.tar.gz" \
			jenkins.build.number="1174"
