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
  echo "PS1='[\u@\h \W]\$ '" >> "${HOME}"/.bashrc
fi

#############################################################################
# use java 8 if USE_JAVA8 is set to 'true', 
# use java 17 if USE_JAVA17 is set to 'true', 
# by default it is java 11
#############################################################################
if [ "${USE_JAVA8}" == "true" ] && [ ! -z "${JAVA_HOME_8}" ]; then
  rm -r "${HOME}"/.java/current/*
  ln -s "${JAVA_HOME_8}"/* "${HOME}"/.java/current
  echo "Java environment set to ${JAVA_HOME_8}"
elif [ "${USE_JAVA17}" == "true" ] && [ ! -z "${JAVA_HOME_17}" ]; then
  rm -r "${HOME}"/.java/current/*
  ln -s "${JAVA_HOME_17}"/* "${HOME}"/.java/current
  echo "Java environment set to ${JAVA_HOME_17}"
else
  echo "Java environment set to ${JAVA_HOME_11}"
fi

if [[ ! -z "${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}" ]]; then
  ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
fi

#############################################################################
# If KUBEDOCK_ENABLED="true" then link podman to /usr/bin/podman.wrapper
# else link podman to /usr/bin/podman.orig
#############################################################################
if [[ "${KUBEDOCK_ENABLED:-false}" == "true" ]]; then
    echo
    echo "Kubedock is enabled (env variable KUBEDOCK_ENABLED is set to true)."

    SECONDS=0
    until [ -f /home/user/.kube/config ]; do
        if (( SECONDS > 10 )); then
            echo "Giving up..."
            exit 1
        fi
        echo "Kubeconfig doesn't exist yet. Waiting..."
        sleep 1
    done
    echo "Kubeconfig found."

    KUBEDOCK_PARAMS=${KUBEDOCK_PARAMS:-"--reverse-proxy"}

    echo "Starting kubedock with params \"${KUBEDOCK_PARAMS}\"..."
    
    kubedock server "${KUBEDOCK_PARAMS}" > /tmp/kubedock.log 2>&1 &
    
    echo "Done."

    echo "Replacing podman with podman-wrapper.sh..."

    mkdir -p /home/user/.local/bin/
    ln -f -s /usr/bin/podman-wrapper.sh /home/user/.local/bin/podman

    export TESTCONTAINERS_RYUK_DISABLED="true"
    export TESTCONTAINERS_CHECKS_DISABLE="true"

    echo "Done."
    echo
else
    echo
    echo "Kubedock is disabled. It can be enabled with the env variable \"KUBEDOCK_ENABLED=true\""
    echo "set in the workspace Devfile or in a Kubernetes ConfigMap in the developer namespace."
    echo
    mkdir -p /home/user/.local/bin/
    ln -f -s /usr/bin/podman.orig /home/user/.local/bin/podman
fi

exec "$@"
