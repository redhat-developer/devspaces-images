#!/bin/sh
#
# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

set -e

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

if ! grep -Fq "${USER_ID}" /etc/passwd; then
    # current user is an arbitrary
    # user (its uid is not in the
    # container /etc/passwd). Let's fix that
    cat ${HOME}/passwd.template | \
    sed "s/\${USER_ID}/${USER_ID}/g" | \
    sed "s/\${GROUP_ID}/${GROUP_ID}/g" | \
    sed "s/\${HOME}/\/home\/theia/g" > /etc/passwd

    cat ${HOME}/group.template | \
    sed "s/\${USER_ID}/${USER_ID}/g" | \
    sed "s/\${GROUP_ID}/${GROUP_ID}/g" | \
    sed "s/\${HOME}/\/home\/theia/g" > /etc/group
fi

# Grant access to projects volume in case of non root user with sudo rights
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo -n true > /dev/null 2>&1; then
    sudo chown "${USER_ID}:${GROUP_ID}" /projects
fi

# Setup .venv in the 'venv' volume that should be mounted in HOME/.venv
mkdir -p "${HOME}"/.venv
if [ ! -f "${HOME}"/.venv/bin/activate ]; then
  echo "${HOME}"/.venv is empty, moving files from "${HOME}"/.venv-tmp/
  mv "${HOME}"/.venv-tmp/* "${HOME}"/.venv
fi


if [[ ! -z "${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}" ]]; then
  ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
fi

exec "$@"
