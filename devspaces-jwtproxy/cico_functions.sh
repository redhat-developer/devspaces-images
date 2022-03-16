#!/bin/bash
#
# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Output command before executing
set -x

# Exit on error
set -e

# Source environment variables of the jenkins slave
# that might interest this worker.
function load_jenkins_vars() {
  if [ -e "jenkins-env.json" ]; then
    eval "$(./env-toolkit load -f jenkins-env.json \
            DEVSHIFT_TAG_LEN \
            QUAY_ECLIPSE_CHE_USERNAME \
            QUAY_ECLIPSE_CHE_PASSWORD \
            JENKINS_URL \
            GIT_BRANCH \
            GIT_COMMIT \
            BUILD_NUMBER \
            ghprbSourceBranch \
            ghprbActualCommit \
            BUILD_URL \
            ghprbPullId)"
  fi
}

function install_deps() {
  # We need to disable selinux for now, XXX
  /usr/sbin/setenforce 0  || true

  # Get all the deps in
  yum install -d1 -y yum-utils device-mapper-persistent-data lvm2
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  yum install -d1 -y docker-ce \
    git

  service docker start
  echo 'CICO: Dependencies installed'
}

function set_nightly_tag() {
  # Let's set the tag as nightly
  export TAG="nightly"
}

function set_git_commit_tag() {
  # Let's obtain the tag based on the 
  # git commit hash
  GIT_COMMIT_TAG=$(echo "$GIT_COMMIT" | cut -c1-"${DEVSHIFT_TAG_LEN}")
  export GIT_COMMIT_TAG
}

function tag_push() {
  local TARGET=$1
  docker tag "${IMAGE}" "$TARGET"
  docker push "$TARGET" | cat
}

function build_and_push() {
  DEFAULT_TAG="latest"
  REGISTRY="quay.io"
  DOCKERFILE="Dockerfile"
  ORGANIZATION="eclipse"
  IMAGE="che-jwtproxy"

  if [ -n "${QUAY_ECLIPSE_CHE_USERNAME}" ] && [ -n "${QUAY_ECLIPSE_CHE_PASSWORD}" ]; then
    docker login -u "${QUAY_ECLIPSE_CHE_USERNAME}" -p "${QUAY_ECLIPSE_CHE_PASSWORD}" "${REGISTRY}"
  else
    echo "Could not login, missing credentials for pushing to the '${ORGANIZATION}' organization"
  fi

  # Let's build and push image to 'quay.io' using git commit hash as tag first
  set_git_commit_tag
  docker build -t ${IMAGE} -f ./build/dockerfiles/${DOCKERFILE} . | cat
  tag_push "${REGISTRY}/${ORGANIZATION}/${IMAGE}:${GIT_COMMIT_TAG}"
  echo "CICO: '${GIT_COMMIT_TAG}' version of images pushed to '${REGISTRY}/${ORGANIZATION}' organization"

  # If additional tag is set (e.g. "nightly"), let's tag the image accordingly and also push to 'quay.io'
  # Otherwise, let's tag the image as 'latest' and push to 'quay.io'
  TAG=${TAG:-${DEFAULT_TAG}}
  tag_push "${REGISTRY}/${ORGANIZATION}/${IMAGE}:${TAG}"
  echo "CICO: '${TAG}'  version of images pushed to '${REGISTRY}/${ORGANIZATION}' organization"
}
