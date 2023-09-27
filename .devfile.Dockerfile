# Copyright (c) 2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# This container featres tools required for Devspaces Images
FROM quay.io/devfile/universal-developer-image:ubi8-latest

#install Go 1.18 (needed to work with devspaces-operator)
RUN cd /tmp && wget https://go.dev/dl/go1.18.6.linux-amd64.tar.gz && \
        mkdir $HOME/go1.18 && \
        tar -xvzf go1.18.6.linux-amd64.tar.gz -C $HOME/go1.18 --strip-components 1 && \
        if ! grep -q "export PATH=\$HOME/go1.18/bin:\$PATH" $HOME/.bashrc; then echo "export PATH=\$HOME/go1.18/bin:\$PATH" >> $HOME/.bashrc; fi

# install goimports (needed to work with devspaces-operator)
RUN $HOME/go1.18/bin/go install golang.org/x/tools/cmd/goimports@latest
