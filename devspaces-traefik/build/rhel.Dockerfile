# https://registry.access.redhat.com/rhel8-6-els/rhel
FROM registry.redhat.io/rhel8-6-els/rhel:8.6-1440 as builder
USER 0

# cachito
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
RUN source $REMOTE_SOURCES_DIR/devspaces-images-traefik/cachito.env
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn 

# CRW-3531 note: build fails when run with python39 and nodejs:16; so stick with python2 and nodejs:12
ENV NODEJS_VERSION="12:8020020200326104117/development"
RUN dnf -y -q install python2 golang make gcc-c++ openssl-devel && \
    dnf -y -q module install nodejs:$NODEJS_VERSION && \
    yarn config set nodedir /usr

#WEBUI
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/webui
RUN yarn config set unsafe-perm true && \
    yarn install && \
    npm run build:nc

#GO BUILD
RUN cp $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik
# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
ENV CGO_ENABLED=1
RUN go generate && \
    go build ./cmd/traefik

# https://registry.access.redhat.com/rhel8-6-els/rhel
FROM registry.redhat.io/rhel8-6-els/rhel:8.6-1440 

COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/traefik /traefik

RUN chmod 755 /traefik && \
    dnf -y update || true && \ 
    dnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" 

EXPOSE 80
VOLUME ["/tmp"]
ENTRYPOINT ["/traefik"]
