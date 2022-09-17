# WEBUI
# https://registry.access.redhat.com/ubi8/nodejs-14
FROM registry.redhat.io/ubi8/nodejs-14:1-86 as webui 
USER root 
RUN yum install -y python2

ENV WEBUI_DIR /src/webui
RUN mkdir -p $WEBUI_DIR

COPY ./webui/ $WEBUI_DIR/

WORKDIR $WEBUI_DIR

RUN npm install --unsafe-perm=true && npm -g i yarn && npm run build

# BUILD
# https://registry.access.redhat.com/ubi8/go-toolset
FROM registry.redhat.io/ubi8/go-toolset:1.17.12-7
USER root 

ARG TRAEFIK_SHA="c9520"
ENV TRAEFIK_SHA="${TRAEFIK_SHA}"

RUN mkdir -p /usr/local/bin \
    && export GOPATH=/usr/local && go get -u github.com/containous/go-bindata/... \
    && chmod +x /usr/local/bin/go-bindata

WORKDIR /go/src/github.com/traefik/traefik

# Download go modules
COPY go.mod go.sum .
RUN GO111MODULE=on GOPROXY=https://proxy.golang.org go mod download
COPY . /go/src/github.com/traefik/traefik

RUN rm -rf /go/src/github.com/traefik/traefik/static/
COPY --from=webui /src/webui/static /go/src/github.com/traefik/traefik/static/

RUN export VERSION="${TRAEFIK_SHA}" && ./script/make.sh generate binary
