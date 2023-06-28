# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.8-860 as builder
USER 0

# CRW-3531 note: build fails when run with python39 and nodejs:16; so stick with python2 and nodejs:12
ENV NODEJS_VERSION="12"
RUN microdnf -y install dnf && \
    dnf -y -q install python2 golang make gcc-c++ openssl-devel && \
    dnf -y -q module install nodejs:$NODEJS_VERSION && \
    npm -g i yarn && \
    yarn config set nodedir /usr

#WEBUI
RUN mkdir /src
COPY ./ /src/

WORKDIR /src/webui
RUN yarn config set unsafe-perm true && \
    yarn install && \
    npm run build:nc

#GO BUILD
ARG TRAEFIK_SHA="c9520"
ENV TRAEFIK_SHA="${TRAEFIK_SHA}"

RUN cp /src/script/ca-certificates.crt /etc/ssl/certs/

WORKDIR /src

RUN go mod download && \
    go generate && \
    go build ./cmd/traefik

# https://registry.access.redhat.com/ubi8-minimal 
FROM registry.access.redhat.com/ubi8-minimal:8.8-860 

COPY --from=builder /src/script/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/traefik /traefik

RUN chmod 755 /traefik && \
    microdnf -y update || true && \ 
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages" 

EXPOSE 80
VOLUME ["/tmp"]
ENTRYPOINT ["/traefik"]
