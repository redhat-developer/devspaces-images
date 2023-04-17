#
# Copyright (c) 2018-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#   IBM Corporation - implementation
#

# Previously built plugin registry - need this to get the editor devfile.yaml files instead of pulling from
# https://redhat-developer.github.io/devspaces/che-plugin-registry/next/x86_64/v3/plugins/
#   https://redhat-developer.github.io/devspaces/che-plugin-registry/next/x86_64/v3/plugins/che-incubator/che-code/latest/devfile.yaml
#   https://redhat-developer.github.io/devspaces/che-plugin-registry/next/x86_64/v3/plugins/che-incubator/che-idea/latest/devfile.yaml

# TODO need to make sure this 3.y tag is updated with every new milestone
FROM registry-proxy.engineering.redhat.com/rh-osbs/devspaces-pluginregistry-rhel8:3.6 as pluginregistrybuilder
# get content from /var/www/html/v3/plugins/ ... che-incubator/che-code/latest/devfile.yaml and che-incubator/che-idea/latest/devfile.yaml

# Builder: check meta.yamls and create index.json
<<<<<<< Updated upstream
# https://registry.access.redhat.com/ubi8/python-38
FROM ubi8/python-38:1-125.1680797945 as builder
USER 0
=======
# https://registry.access.redhat.com/ubi8/python-39
FROM ubi8/python-39:1-97 as builder
>>>>>>> Stashed changes

# hadolint ignore=DL3002
USER root

# cachito:all step 1: copy cachito sources where we can use them
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

ENV PYTHON_VERSION=3.9

# if not defined or string is null, allow all registries/tags in list_referenced_images
# otherwise restrict to only those space-separated registries/tags; if others found, build will fail
# useful for failing build if quay images in an RC, or wrong devspaces image tag (3.2 in 3.1 build)
ARG ALLOWED_REGISTRIES=""
ENV ALLOWED_REGISTRIES=${ALLOWED_REGISTRIES}
ARG ALLOWED_TAGS=""
ENV ALLOWED_TAGS=${ALLOWED_TAGS}

# enable content sets to resolve jq as rpm
COPY ./build/dockerfiles/content_sets_rhel8.repo /etc/yum.repos.d/
# install yq and jq
# hadolint ignore=DL3003,DL4006,SC2086,DL3040,DL3041
RUN dnf -y -q install python39 python39-devel python39-setuptools python39-pip jq tree && \
    # tree -L 2 "$REMOTE_SOURCES_DIR/*/app/" && \
    # cachito #2: install yq using cachito sources
    cd $REMOTE_SOURCES_DIR/python-deps/app/devspaces-devfileregistry/build/python && \
    source $REMOTE_SOURCES_DIR/python-deps/cachito.env && \
    python${PYTHON_VERSION} -m pip install --no-cache-dir --upgrade pip argcomplete setuptools yq && yq --version

###############################

# cachito:yarn step 2: workaround for yarn v1 not being installed in an executable path
# use yarn v1 because https://issues.redhat.com/browse/STONEBLD-774
# hadolint ignore=SC2086
RUN ln -s $REMOTE_SOURCES_DIR/plugin-registry-generator/app/.yarn/releases/yarn-1*js /usr/local/bin/yarn && yarn --version

###############################

#### plugin-registry-generator ####

# cachito:yarn step 3: load env vars, set working dir, fetch deps, and build
WORKDIR $REMOTE_SOURCES_DIR/plugin-registry-generator/app/
# hadolint ignore=SC2086,DL3003
RUN source $REMOTE_SOURCES_DIR/plugin-registry-generator/cachito.env; \
    # cachito workaround for missing .pem file in target build folder
    cp $REMOTE_SOURCES_DIR/plugin-registry-generator/app/registry-ca.pem \
       $REMOTE_SOURCES_DIR/plugin-registry-generator/app/tools/build/; \

    # cachito:yarn: configure yarn
    # change network timeout (slow using multi-arch build)
    yarn config set network-timeout 600000 -g; \
    # see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
    yarn config set nodedir /usr; yarn config set unsafe-perm true; \

    # debug
    # cat ../cachito.env; \
    # ls -la $REMOTE_SOURCES_DIR/; \
    # echo "######## config ########"; \
    # npm config list -l; \
    # yarn config list --verbose; \
    # echo "######## config ########"; \

    # initialize a git repository in plugin-registry-generator/app/ with one dummy commit
    git config --global user.name "Dev Spaces Build"; git config --global user.email devspaces-build@redhat.com; \
    git config --global push.default matching; git config --global pull.rebase true; \
    git config --global init.defaultBranch main; git init .; touch .gitempty; git add .gitempty; git commit -m "Empty dummy commit" .gitempty; git log; \

    yarn install && \
    cd tools/build && \
    yarn build

###############################

#### devworkspace-generator ####

# cachito:yarn step 3: load env vars, set working dir, fetch deps, and build
WORKDIR $REMOTE_SOURCES_DIR/devworkspace-generator/app/
# hadolint ignore=SC2086,DL3003
RUN source $REMOTE_SOURCES_DIR/devworkspace-generator/cachito.env; \
    # cachito workaround for missing .pem file in target build folder
    cp $REMOTE_SOURCES_DIR/devworkspace-generator/app/registry-ca.pem \
       $REMOTE_SOURCES_DIR/devworkspace-generator/app/tools/devworkspace-generator/; \

    # cachito:yarn: configure yarn
    # change network timeout (slow using multi-arch build)
    yarn config set network-timeout 600000 -g; \
    # see https://docs.engineering.redhat.com/pages/viewpage.action?pageId=228017926#UpstreamSources(Cachito,ContainerFirst)-CachitoIntegrationfornpm
    yarn config set nodedir /usr; yarn config set unsafe-perm true; \

    # debug
    # cat ../cachito.env; \
    # ls -la $REMOTE_SOURCES_DIR/; \
    # echo "######## config ########"; \
    # npm config list -l; \
    # yarn config list --verbose; \
    # echo "######## config ########"; \

    # initialize a git repository in plugin-registry-generator/app/ with one dummy commit
    git config --global user.name "Dev Spaces Build"; git config --global user.email devspaces-build@redhat.com; \
    git config --global push.default matching; git config --global pull.rebase true; \
    git config --global init.defaultBranch main; git init .; touch .gitempty; git add .gitempty; git commit -m "Empty dummy commit" .gitempty; git log; \

    cd tools/devworkspace-generator && \
    yarn install && \
    # symlink the binary so we can more easily call it from brew.generate_devworkspace_templates.sh
    chmod +x $REMOTE_SOURCES_DIR/devworkspace-generator/app/tools/devworkspace-generator/lib/entrypoint.js && \
    ln -s $REMOTE_SOURCES_DIR/devworkspace-generator/app/tools/devworkspace-generator/lib/entrypoint.js /usr/bin/che-devworkspace-generator 

###############################

# set new working dir and complete the build
WORKDIR /build/
COPY ./build/scripts ./versions.json ./job-config.json /build/
COPY ./devfiles /build/devfiles
# get plugin registry content from /var/www/html/v3/plugins/ ... che-incubator/che-code/latest/devfile.yaml and che-incubator/che-idea/latest/devfile.yaml
COPY --from=pluginregistrybuilder /var/www/html/v3/plugins /build/plugins

# hadolint ignore=DL3016
RUN ls -l plugins/*/*/*/devfile.y*ml; \
    ./brew.generate_devworkspace_templates.sh && chmod -R g+rwX /build/resources && \
    rm -fr /build/plugins/ && \

    # validate devfile content
    ./check_referenced_images.sh devfiles --registries "${ALLOWED_REGISTRIES}" --tags "${ALLOWED_TAGS}" && \
    ./check_mandatory_fields.sh devfiles && \

	# Cache devspaces-samples projects for offline/airgap, using local cachito sources
    ./cache_projects.sh devfiles resources && \

    # remove devfiles that are not compatible with this arch, if applicable
    ./swap_yamlfiles.sh devfiles && \

    # generate index and listing files
    ./index.sh > /build/devfiles/index.json && \
    ./list_referenced_images.sh devfiles > /build/devfiles/external_images.txt && \
    ./list_referenced_images_by_file.sh devfiles > /build/devfiles/external_images_by_devfile.txt && \
    chmod -R g+rwX /build/devfiles /build/resources

################# 
# PHASE TWO: configure registry image
################# 

# Build registry, copying meta.yamls and index.json from builder
# https://registry.access.redhat.com/rhel8/httpd-24
<<<<<<< Updated upstream
FROM rhel8/httpd-24:1-256.1680797936 AS registry
=======
FROM rhel8/httpd-24:1-256 AS registry
# hadolint ignore=DL3002
>>>>>>> Stashed changes
USER 0

# latest httpd container doesn't include ssl cert, so generate one
# hadolint ignore=DL4006
RUN chmod +x /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

# hadolint ignore=SC2140
RUN echo "<FilesMatch "\""^\\.ht"\"">" >> /etc/httpd/conf/httpd.conf && \
    echo "Require all denied" >> /etc/httpd/conf/httpd.conf && \
    echo "</FilesMatch>" >> /etc/httpd/conf/httpd.conf

RUN sed -i /etc/httpd/conf.d/ssl.conf \
    -e "s,SSLProtocol all -SSLv2,SSLProtocol all -SSLv3," \
    -e "s,SSLCipherSuite HIGH:MEDIUM:!aNULL:!MD5,SSLCipherSuite HIGH:!aNULL:!MD5,"

RUN sed -i /etc/httpd/conf/httpd.conf \
    -e "s,Listen 80,Listen 8080," \
    -e "s,logs/error_log,/dev/stderr," \
    -e "s,logs/access_log,/dev/stdout," \
    -e "s,AllowOverride None,AllowOverride All," && \
    chmod a+rwX /etc/httpd/conf /run/httpd /etc/httpd/logs/
STOPSIGNAL SIGWINCH

ARG DS_BRANCH=devspaces-3-rhel-8
ENV DS_BRANCH=${DS_BRANCH}

WORKDIR /var/www/html

RUN mkdir -m 777 /var/www/html/devfiles
COPY README.md .htaccess /var/www/html/
COPY --from=builder /build/devfiles /var/www/html/devfiles
COPY --from=builder /build/resources /var/www/html/resources
COPY ./images /var/www/html/images
COPY ./build/dockerfiles/rhel.entrypoint.sh ./build/dockerfiles/entrypoint.sh /usr/local/bin/
RUN chmod g+rwX /usr/local/bin/entrypoint.sh /usr/local/bin/rhel.entrypoint.sh && \
    chgrp -R 0 /var/www/html && chmod -R g+rw /var/www/html
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

# append Brew metadata here
ENV SUMMARY="Red Hat OpenShift Dev Spaces devfileregistry container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces devfileregistry container" \
    PRODNAME="devspaces" \
    COMPNAME="devfileregistry-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.6" \
      license="EPLv2" \
      maintainer="Valerii Svydenko <vsvydenk@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
