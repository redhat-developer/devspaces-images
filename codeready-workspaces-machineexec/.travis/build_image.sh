#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
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

#shellcheck disable=SC1073 disable=SC2066 disable=SC2153
for image in ${IMAGE}; do
    the_image="${REGISTRY}/${ORGANIZATION}/${image}"

    # Build images
    docker build -f build/dockerfiles/Dockerfile -t "${the_image}:${TAG}-${TRAVIS_CPU_ARCH}" .
    docker push "${the_image}:${TAG}-${TRAVIS_CPU_ARCH}"

    # Tag image with short_sha in case of next build
    if [[ "$TAG" == "next-travis" ]]; then
        docker tag "${the_image}:${TAG}-${TRAVIS_CPU_ARCH}" "${the_image}:${SHORT_SHA}-${TRAVIS_CPU_ARCH}"
        docker push "${the_image}:${SHORT_SHA}-${TRAVIS_CPU_ARCH}"
    fi
done
