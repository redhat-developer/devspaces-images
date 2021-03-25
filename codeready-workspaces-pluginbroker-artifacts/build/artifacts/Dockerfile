#
# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

FROM golang:1.14-alpine3.12 as builder
RUN apk add --no-cache ca-certificates
RUN adduser -D -g '' appuser
WORKDIR /build/che-plugin-broker/brokers/artifacts/cmd/
COPY . /build/che-plugin-broker/
RUN CGO_ENABLED=0 GOOS=linux go build -mod vendor -a -ldflags '-w -s' -installsuffix cgo -o artifacts-broker main.go


FROM alpine:3.12
USER appuser
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/che-plugin-broker/brokers/artifacts/cmd/artifacts-broker /
ENTRYPOINT ["/artifacts-broker"]
