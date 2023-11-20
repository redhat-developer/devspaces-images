# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.9-1029 as builder
USER 0

# cachito
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
RUN source $REMOTE_SOURCES_DIR/devspaces-images-traefik/cachito.env
WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik

RUN microdnf -y install dnf && \
    dnf -y -q install python2 golang make gcc-c++ openssl-devel

#GO BUILD
ARG TRAEFIK_SHA="d97d3"
ENV TRAEFIK_SHA="${TRAEFIK_SHA}"

RUN cp $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik
# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
ENV CGO_ENABLED=1
RUN go generate && \
    go build ./cmd/traefik

# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.9-1029 

COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/script/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder $REMOTE_SOURCES_DIR/devspaces-images-traefik/app/devspaces-traefik/traefik /traefik

RUN chmod 755 /traefik && \
    microdnf -y update || true && \ 
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" 

EXPOSE 80
VOLUME ["/tmp"]
ENTRYPOINT ["/traefik"]

ENV SUMMARY="Red Hat OpenShift Dev Spaces traefik container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces traefik container" \
    TRAEFIK_VERSION="v2.9.6" \
    PRODNAME="devspaces" \
    COMPNAME="traefik-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.11" \
      license="EPLv2" \
      maintainer="Samantha Dawley <sdawley@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
