# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal 
FROM ubi8-minimal:8.5-240.1648458092 

COPY asset-*.tar.gz /tmp/assets/ 
COPY script/ca-certificates.crt /etc/ssl/certs/
RUN microdnf -y install tar gzip && \ 
    tar xzf /tmp/assets/asset-traefik-$(uname -m).tar.gz -C / && \ 
    rm -fr /tmp/assets/ && \ 
    chmod 755 /traefik && \ 
    microdnf -y remove tar gzip && \ 
    microdnf -y update || true && \ 
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" 

EXPOSE 80
VOLUME ["/tmp"]
ENTRYPOINT ["/traefik"]

ENV SUMMARY="Red Hat OpenShift Dev Spaces traefik container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces traefik container" \
    TRAEFIK_VERSION="v2.5.0" \
    GOLANG_VERSION="1.16.2" \
    PRODNAME="devspaces" \
    COMPNAME="traefik-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.1" \
      license="EPLv2" \
      maintainer="Lukas Krejci <lkrejci@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
