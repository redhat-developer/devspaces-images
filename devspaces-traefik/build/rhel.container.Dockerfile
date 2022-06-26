# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.6-751.1655117800 

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
