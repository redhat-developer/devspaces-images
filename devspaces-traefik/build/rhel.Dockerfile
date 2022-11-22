# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.7-923 as builder
USER 0

# cachito
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
RUN source $REMOTE_SOURCES_DIR/devspaces-images-traefik/cachito.env
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik

# cachito:yarn step 2: workaround for yarn not being installed in an executable path
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn 

ENV \
    NODEJS_VERSION="16" \
    PYTHON_VERSION="3.9"
RUN microdnf -y install dnf && \
    dnf -y -q module install python39:${PYTHON_VERSION} && \
    dnf -y -q install python2 golang make gcc-c++ openssl-devel && \
    dnf -y -q module install nodejs:$NODEJS_VERSION && \
    yarn config set nodedir /usr

#WEBUI
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/webui
RUN yarn config set unsafe-perm true && \
    yarn install && \
    npm run build:nc

#GO BUILD
ARG TRAEFIK_SHA="c9520"
ENV TRAEFIK_SHA="${TRAEFIK_SHA}"

RUN cp $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik
RUN go generate && \
    go build ./cmd/traefik

# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.7-923 

COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/traefik /traefik

RUN chmod 755 /traefik && \
    microdnf -y update || true && \ 
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" 

EXPOSE 80
VOLUME ["/tmp"]
ENTRYPOINT ["/traefik"]
