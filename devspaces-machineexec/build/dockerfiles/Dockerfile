#
# Copyright (c) 2012-2021 Red Hat, Inc.
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

FROM golang:1.15.0-alpine as go_builder

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
RUN apk update && apk add --no-cache git && update-ca-certificates

# compile machine exec binary file
WORKDIR /che-machine-exec/
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o /go/bin/che-machine-exec .

FROM docker.io/node:10.16-alpine as cloud_shell_builder
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
