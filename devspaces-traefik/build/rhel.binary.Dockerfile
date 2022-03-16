# WEBUI
FROM registry.redhat.io/rhel8/nodejs-12 as webui 
USER root 
RUN yum install -y python2

ENV WEBUI_DIR /src/webui
RUN mkdir -p $WEBUI_DIR

COPY ./webui/ $WEBUI_DIR/

WORKDIR $WEBUI_DIR

RUN npm install --unsafe-perm=true
RUN npm run build

# BUILD
FROM registry.redhat.io/ubi8 as gobuild

ARG GOLANG_VERSION="1.16.2"
ENV GOLANG_VERSION="${GOLANG_VERSION}"
ARG TRAEFIK_SHA="e0b44"
ENV TRAEFIK_SHA="${TRAEFIK_SHA}"

RUN true \
    && dnf install -y git gcc \
    && update-ca-trust \
    && rm -rf /var/cache/apk/*

RUN mkdir -p /usr/local/bin \
    && ARCH=$(uname -m) && if [ "$ARCH" == "x86_64" ] ; then ARCH=amd64; fi \ 
    && curl -fsSL -O https://golang.org/dl/go${GOLANG_VERSION}.linux-$ARCH.tar.gz \ 
    && tar xzf go${GOLANG_VERSION}.linux-$ARCH.tar.gz -C /usr/local \ 
    && ln -s /usr/local/go/bin/go /usr/local/bin/go \ 
    && ln -s /usr/local/go/bin/gofmt /usr/local/bin/gofmt \ 
    && export GOPATH=/usr/local && go get -u github.com/containous/go-bindata/... \
    && chmod +x /usr/local/bin/go-bindata

WORKDIR /go/src/github.com/traefik/traefik

# Download go modules
COPY go.mod .
COPY go.sum .
RUN GO111MODULE=on GOPROXY=https://proxy.golang.org go mod download

COPY . /go/src/github.com/traefik/traefik

RUN rm -rf /go/src/github.com/traefik/traefik/static/
COPY --from=webui /src/static/ /go/src/github.com/traefik/traefik/static/

RUN export VERSION="${TRAEFIK_SHA}" && ./script/make.sh generate binary

