#!/bin/sh
#
# Copyright (c) 2019-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

if ! whoami &> /dev/null; then
  echo "${USER_NAME:-user}:x:${USER_ID}:0:${USER_NAME:-user} user:${HOME}:/bin/sh" >> /etc/passwd
fi
/scripts/watcher &
supercronic  /etc/crontabs/backup-cron-job 

/usr/sbin/sshd -p 2222
tail -f /dev/null
