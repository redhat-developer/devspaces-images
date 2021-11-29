#!/bin/sh
#
# Copyright (c) 2019-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

USER_NAME="user"
##### SSH options #####
SSH_OPTIONS=""
# Add SSH connection options
SSH_OPTIONS=" ${SSH_OPTIONS} -i /etc/ssh/private/rsync-via-ssh -l ${USER_NAME} -p ${RSYNC_PORT}"
# Disable password authentication since we use key-based auth
SSH_OPTIONS=" ${SSH_OPTIONS} -o PasswordAuthentication=no"
# Disable hosts fingerprint checking because it may fail due to
# starting different containers on the same ports after some period
SSH_OPTIONS=" ${SSH_OPTIONS} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
# Set SSH logging level to make it possible to investigate problems
#SSH_OPTIONS+=" -o LogLevel=${SSH_LOG_LEVEL}"

##### Rsync options #####
RSYNC_OPTIONS=" --info=progress2 -ah --no-inc-recursive"
#RSYNC_OPTIONS=" ${RSYNC_OPTIONS} --quiet"
RSYNC_OPTIONS=" ${RSYNC_OPTIONS} --recursive"
# Throughput limit for rsync
#RSYNC_OPTIONS+=" --bwlimit=${RSYNC_RESTORE_BWLIMIT}"
# Sync modification timestamps to optimise transfer of not modified files.
RSYNC_OPTIONS=" ${RSYNC_OPTIONS}  --omit-dir-times " #--times"
# Delete files/folders on receiving side if they are not present on sending side.
RSYNC_OPTIONS=" ${RSYNC_OPTIONS} --delete"
# Preserve sym links in a safe way
RSYNC_OPTIONS=" ${RSYNC_OPTIONS} --links --safe-links"
# Transition of ownership and permissions
RSYNC_OPTIONS=" ${RSYNC_OPTIONS}  --no-o --no-g --no-perms" #--owner --group --numeric-ids
#########################
#checking is directory exist
#sometimes meet networking issues so here we will try connect several times with some delay
#need to investigate more details
READY=false
for i in `seq 5`; do
  ssh -i /etc/ssh/private/rsync-via-ssh -q async-storage -p ${RSYNC_PORT} [[ -d /async-storage/${CHE_WORKSPACE_ID} ]]
  if [[ $? -eq 0 ]]; then
    READY=true
    break;
  fi
  sleep 5;
done

if [[ $READY ]]; then
    rsync ${RSYNC_OPTIONS} --rsh="ssh  ${SSH_OPTIONS}"  async-storage:/async-storage/${CHE_WORKSPACE_ID}/projects/  ${CHE_PROJECTS_ROOT}/
fi

