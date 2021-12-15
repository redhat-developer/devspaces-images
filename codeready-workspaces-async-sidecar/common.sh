#!/bin/bash
#
# Copyright (c) 2012-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

IMAGE_AGENT=che-sidecar-workspace-data-sync
IMAGE_STORAGE=che-workspace-data-sync-storage
TAG=$1
ORGANIZATION=$2
REPOSITORY=$3

function compile() {
  echo "Compile file sync progress watcher binary from source code"
  $(GOOS=linux go build -o ./dockerfiles/agent/scripts/watcher ./watcher/watcher.go)
  if [ $? != 0 ]; then
    echo "Failed to compile code"
    exit 0
  fi
  echo "Compilation successfully completed"
}

function dockerBuild() {
  printf "Build docker image %s/%s/%s:%s \n" "$REPOSITORY" "$ORGANIZATION" "$IMAGE_AGENT" "$TAG";
  docker build -t "$REPOSITORY/$ORGANIZATION/$IMAGE_AGENT:$TAG" ./dockerfiles/agent
  if [ $? != 0 ]; then
    printf "Failed build docker image %s/%s/%s:%s \n" "$REPOSITORY" "$ORGANIZATION" "$IMAGE_AGENT" "$TAG";
    exit 0
  fi

  printf "Build docker image %s/%s/%s:%s \n" "$REPOSITORY" "$ORGANIZATION" "$IMAGE_STORAGE" "$TAG";
  docker build -t "$REPOSITORY/$ORGANIZATION/$IMAGE_STORAGE:$TAG" ./dockerfiles/storage
  if [ $? != 0 ]; then
    printf "Failed build docker image %s/%s/%s:%s \n" "$REPOSITORY" "$ORGANIZATION" "$IMAGE_STORAGE" "$TAG";
    exit 0
  fi

  echo "Build images successfully completed"
}

function dockerTag() {
  VERSION=$(head -n 1 VERSION)
  echo "Taging images to the ${VERSION}"
  docker tag quay.io/eclipse/che-workspace-data-sync-storage:latest quay.io/eclipse/che-workspace-data-sync-storage:"${VERSION}"
  docker tag quay.io/eclipse/che-sidecar-workspace-data-sync:latest quay.io/eclipse/che-sidecar-workspace-data-sync:"${VERSION}"
}

function dockerPushTag() {
  VERSION=$(head -n 1 VERSION)
  echo "Push images version: ${VERSION}"
  docker push quay.io/eclipse/che-workspace-data-sync-storage:"${VERSION}"
  docker push quay.io/eclipse/che-sidecar-workspace-data-sync:"${VERSION}"
}

function dockerPushLatest() {
  echo "Push latest images"
  docker push quay.io/eclipse/che-workspace-data-sync-storage:latest
  docker push quay.io/eclipse/che-sidecar-workspace-data-sync:latest
}

function dockerPushNext() {
  echo "Push next images"
  docker push quay.io/eclipse/che-workspace-data-sync-storage:next
  docker push quay.io/eclipse/che-sidecar-workspace-data-sync:next
}

function gitPushTag() {
  VERSION=$(head -n 1 VERSION)
  echo "Create tag "${VERSION}" on GitHub"
  git checkout release -f 
  git tag "${VERSION}"
  git push origin "${VERSION}"
}
