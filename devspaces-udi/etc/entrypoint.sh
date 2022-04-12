#!/bin/sh
#
# Copyright (c) 2019-2022 Red Hat, Inc.
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
    sed "s/\${HOME}/\/home\/user/g" > /etc/passwd

    cat ${HOME}/group.template | \
    sed "s/\${USER_ID}/${USER_ID}/g" | \
    sed "s/\${GROUP_ID}/${GROUP_ID}/g" | \
    sed "s/\${HOME}/\/home\/user/g" > /etc/group
fi

#############################################################################
# Grant access to projects volume in case of non root user with sudo rights
#############################################################################
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo -n true > /dev/null 2>&1; then
    sudo chown "${USER_ID}:${GROUP_ID}" /projects
fi

if [ -f "${HOME}"/.venv/bin/activate ]; then
  source "${HOME}"/.venv/bin/activate
fi

#############################################################################
# Setup $PS1 for a consistent and reasonable prompt
#############################################################################
if [ -w "${HOME}" ] && [ ! -f "${HOME}"/.bashrc ]; then
  echo "PS1='[\u@\h \W]\$ '" > "${HOME}"/.bashrc
fi

#############################################################################
# Use java 8 ONLY if USE_JAVA8 is set to 'true'
#############################################################################
if [ "${USE_JAVA8}" == "true" ] && [ ! -z "${JAVA8_HOME}" ]; then
  echo "JAVA_HOME=${JAVA8_HOME}" >> "${HOME}"/.bashrc
  echo "PATH=${JAVA8_HOME}/bin:${PATH}" >> "${HOME}"/.bashrc
  echo "Java environment set to ${JAVA8_HOME}"
else
  if [ ! -z "${JAVA11_HOME}" ]; then
    echo "JAVA_HOME=${JAVA11_HOME}" >> "${HOME}"/.bashrc
    echo "PATH=${JAVA11_HOME}/bin:${PATH}" >> "${HOME}"/.bashrc
    echo "Java environment set to ${JAVA11_HOME}"
  else
    echo "Java environment is not configured"
  fi
fi

if [[ ! -z "${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}" ]]; then
  ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
fi

exec "$@"
