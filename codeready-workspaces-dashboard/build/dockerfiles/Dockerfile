# Copyright (c) 2021     Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM docker.io/node:12.20.1-alpine3.12 as builder

RUN if ! [ type "yarn" &> /dev/null ]; then \
        apk add yarn --no-cache; \
    fi

COPY package.json /dashboard/
COPY yarn.lock /dashboard/
COPY .yarn/releases/yarn-*.cjs /dashboard/.yarn/releases/
COPY .yarnrc.yml /dashboard/
WORKDIR /dashboard
RUN yarn install
COPY . /dashboard/
RUN yarn compile

FROM docker.io/httpd:2.4.43-alpine
RUN sed -i 's|    AllowOverride None|    AllowOverride All|' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's|Listen 80|Listen 8080|' /usr/local/apache2/conf/httpd.conf && \
    mkdir -p /var/www && ln -s /usr/local/apache2/htdocs /var/www/html && \
    chmod -R g+rwX /usr/local/apache2 && \
    echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf

COPY --from=builder /dashboard/lib /usr/local/apache2/htdocs/dashboard
RUN sed -i -r -e 's#<base href="/">#<base href="/dashboard/"#g'  /usr/local/apache2/htdocs/dashboard/index.html
