#
# Copyright (c) 2012-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# Dockerfile defines che-machine-exec production image eclipse/che-machine-exec-dev
#

FROM docker.io/golang:1.19.13-alpine as go_builder

ENV USER=machine-exec
ENV UID=12345
ENV GID=23456

# Add user that will be able to start machine-exec-binary but nothing more
# the result will be propagated then into scratch image
# See https://stackoverflow.com/a/55757473/12429735RUN
RUN addgroup --gid "$GID" "$USER" \
      && adduser \
      --disabled-password \
      --gecos "" \
      --home "$(pwd)" \
      --ingroup "$USER" \
      --no-create-home \
      --uid "$UID" \
      "$USER"
# initialize CA certificates to propagate them into scratch image
RUN apk --update --no-cache add \
    build-base \
    gcc \
    git \
  && rm -rf /tmp/* /var/cache/apk/* && update-ca-certificates

# compile machine exec binary file
WORKDIR /che-machine-exec/
COPY . .
# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
ENV CGO_ENABLED=1
RUN GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o /go/bin/che-machine-exec .

# NOTE: could not compile with node:18-alpine, so for now stick with node:16-alpine
FROM docker.io/node:16-alpine as cloud_shell_builder
COPY --from=go_builder /che-machine-exec/cloud-shell cloud-shell-src
WORKDIR cloud-shell-src
RUN yarn && \
    yarn run build && \
    mkdir /app && \
    cp -rf index.html dist node_modules /app

FROM scratch
COPY --from=go_builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=go_builder /etc/passwd /etc/passwd
COPY --from=go_builder /etc/group /etc/group
USER machine-exec

COPY --from=go_builder /go/bin/che-machine-exec /go/bin/che-machine-exec
COPY --from=cloud_shell_builder /app /cloud-shell
ENTRYPOINT ["/go/bin/che-machine-exec", "--static", "/cloud-shell"]
