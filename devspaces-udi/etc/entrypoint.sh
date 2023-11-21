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
# use java 8 if USE_JAVA8 is set to 'true', 
# use java 17 if USE_JAVA17 is set to 'true', 
# by default it is java 11
#############################################################################
rm -rf /home/tooling/.java/current
mkdir -p /home/tooling/.java/current
if [ "${USE_JAVA8}" == "true" ] && [ ! -z "${JAVA_HOME_8}" ]; then
  ln -s "${JAVA_HOME_8}"/* /home/tooling/.java/current
  echo "Java environment set to ${JAVA_HOME_8}"
elif [ "${USE_JAVA17}" == "true" ] && [ ! -z "${JAVA_HOME_17}" ]; then
  ln -s "${JAVA_HOME_17}"/* /home/tooling/.java/current
  echo "Java environment set to ${JAVA_HOME_17}"
else
  # End of Support for OpenJDK 11 in October 2024
  # https://access.redhat.com/articles/1299013
  echo "TODO: it needs to set JDK 17 as default before OpenJDK 11 hits EOL in October 2024"
  ln -s "${JAVA_HOME_11}"/* /home/tooling/.java/current
  echo "Java environment set to ${JAVA_HOME_11}"
fi

if [[ ! -z "${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}" ]]; then
  ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
fi

#############################################################################
# If KUBEDOCK_ENABLED="true" then link podman to /usr/bin/podman-wrapper.sh
# else link podman to /usr/bin/podman.orig
#############################################################################
if [[ "${KUBEDOCK_ENABLED:-false}" == "true" ]]; then
    echo
    echo "Kubedock is enabled (env variable KUBEDOCK_ENABLED is set to true)."

    SECONDS=0
    KUBEDOCK_TIMEOUT=${KUBEDOCK_TIMEOUT:-10}
    until [ -f $KUBECONFIG ]; do
        if (( SECONDS > KUBEDOCK_TIMEOUT )); then
            break
        fi
        echo "Kubeconfig doesn't exist yet. Waiting..."
        sleep 1
    done

    if [ -f $KUBECONFIG ]; then
      echo "Kubeconfig found."

      KUBEDOCK_PARAMS=${KUBEDOCK_PARAMS:-"--reverse-proxy --kubeconfig $KUBECONFIG"}

      echo "Starting kubedock with params \"${KUBEDOCK_PARAMS}\"..."

      kubedock server ${KUBEDOCK_PARAMS} > /tmp/kubedock.log 2>&1 &

      echo "Done."

      echo "Replacing podman with podman-wrapper.sh..."

      ln -f -s /usr/bin/podman-wrapper.sh /home/tooling/.local/bin/podman

      export TESTCONTAINERS_RYUK_DISABLED="true"
      export TESTCONTAINERS_CHECKS_DISABLE="true"

      echo "Done."
      echo
    else
        echo "Could not find Kubeconfig at $KUBECONFIG"
        echo "Giving up..."
    fi
else
    echo
    echo "Kubedock is disabled. It can be enabled with the env variable \"KUBEDOCK_ENABLED=true\""
    echo "set in the workspace Devfile or in a Kubernetes ConfigMap in the developer namespace."
    echo
    ln -f -s /usr/bin/podman.orig /home/tooling/.local/bin/podman
fi

#############################################################################
# Stow: If persistUserHome is enabled, then the contents of /home/user/
# will be mounted by a PVC and overwritten. In this case, we use stow to
# create symbolic links from /home/tooling/ -> /home/user/.
# Required for https://github.com/eclipse/che/issues/22412
#############################################################################

# /home/user/ will be mounted to by a PVC if persistUserHome is enabled
# We need to override the `set -e` from this script by ensuring the mountpoint command returns 0,
# but we also need to capture the exit code of mountpoint
HOME_USER_MOUNTED=0
mountpoint -q /home/user/ || HOME_USER_MOUNTED=$?

# This file will be created after stowing, to guard from executing stow everytime the container is started
STOW_COMPLETE=/home/user/.stow_completed

if [ $HOME_USER_MOUNTED -eq 0 ] && [ ! -f $STOW_COMPLETE ]; then
    # Create symbolic links from /home/tooling/ -> /home/user/
    stow . -t /home/user/ -d /home/tooling/ --no-folding -v 2 > /tmp/stow.log 2>&1
    # Vim does not permit .viminfo to be a symbolic link for security reasons, so manually copy it
    cp --no-clobber /home/tooling/.viminfo /home/user/.viminfo
    # We have to restore bash-related files back onto /home/user/ (since they will have been overwritten by the PVC)
    # but we don't want them to be symbolic links (so that they persist on the PVC)
    cp --no-clobber /home/tooling/.bashrc /home/user/.bashrc
    cp --no-clobber /home/tooling/.bash_profile /home/user/.bash_profile
    touch $STOW_COMPLETE
fi

exec "$@"
