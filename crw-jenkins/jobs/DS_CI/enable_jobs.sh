#!/bin/bash
#
# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# script to enable jobs in Jenkins

# defaults
JENKINSURL="https://main-jenkins-csb-crwqe.apps.ocp-c1.prod.psi.redhat.com"

usage() {
  echo "
Enable Jenkins jobs for a given release.

Usage: $0 [-t 2.y] 
Example: $0 -t 2.y
"
  exit
}

usageToken()
{
  echo "To enable jobs, you must:
  1. open ${JENKINSURL}/me/configure
  2. create an API token
  3. store your kerberos username and token in file /tmp/token, in format:

username:token
"
  exit
}


# commandline args
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-t') DS_VERSION="$2"; shift 1;; # 2.y # version of job to delete from Jenkins
  esac
  shift 1
done

if [[ ! ${DS_VERSION} ]]; then usage; fi

if [[ -f /tmp/token ]]; then
    USERTOKEN=$(cat /tmp/token)
    for d in \
        configbump\
        dashboard\
        devfileregistry\
        idea\
        imagepuller\
        machineexec\
        operator-bundle\
        operator\
        pluginregistry\
        server\
        theia-akamai\
        theia-sources\
        traefik\
        dsc\
        udi\
        get-sources-rhpkg-container-build\
        push-latest-container-to-quay\
        sync-to-downstream\
        update-digests-in-metadata\
        Releng/job/build-all-images\
        Releng/job/send-email-qe-build-list\
        ; do 
        result=$(curl -sSL -X POST "${JENKINSURL}/job/DS_CI/job/${d}_${DS_VERSION}/enable" --user "${USERTOKEN}" | grep -E "Unauthorized|Authentization|401|URI")
        if [[ $result ]]; then
            echo "ERROR!"
            echo "$result"
            echo
            #usageToken
        else
            echo "Enabled: ${JENKINSURL}/job/DS_CI/job/${d}_${DS_VERSION}/"
        fi
    done
else
  usageToken
fi
