#!/bin/bash -xe

# Copyright (c) 2018-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# shellcheck disable=SC2155
export SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd)
export PHP_LS_VERSION=5.4.6
export PHP_LS_IMAGE="php-ls:tmp"
export PHP_XDEBUG_IMAGE="php-xdebug:tmp"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n stacks-php
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-n') ASSET_NAME="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

cd "$SCRIPT_DIR"
[[ -e target ]] && rm -Rf target

echo ""
echo "Red Hat OpenShift Dev Spaces :: Stacks :: Language Servers :: PHP Dependencies"
echo ""

mkdir -p target/php-ls

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

ARCH="$(uname -m)"
if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi
tarball_php="${WORKSPACE}/asset-php-${ARCH}.tar.gz"
tarball_php_xdebug="${WORKSPACE}/asset-php-xdebug-${ARCH}.tar.gz"

${PODMAN} build . -t ${PHP_LS_IMAGE} -f php-ls.Dockerfile
${PODMAN} run --rm -v "$SCRIPT_DIR"/target/php-ls:/php ${PHP_LS_IMAGE} sh -c "
    cd /php
    /usr/local/bin/composer require jetbrains/phpstorm-stubs:dev-master
    /usr/local/bin/composer require felixfbecker/language-server:${PHP_LS_VERSION}
    /usr/local/bin/composer run-script --working-dir=vendor/felixfbecker/language-server parse-stubs
    mv vendor/* .
    rm -rf vendor
    cp /usr/local/bin/composer /php/composer
    chmod -R 777 /php/*
    "
tar -czf "${tarball_php}" -C target/php-ls .

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball_php}"

mkdir -p target/php-xdebug
${PODMAN} build . -t ${PHP_XDEBUG_IMAGE} -f xdebug.Dockerfile
${PODMAN} run -v "$SCRIPT_DIR"/target/php-xdebug:/xd ${PHP_XDEBUG_IMAGE} sh -c "
    mkdir -p /xd/etc /xd/usr/share/doc/pecl/xdebug /xd/usr/lib64/php/modules/
    cp /etc/php.ini /xd/etc/php.ini
    cp -r /usr/share/doc/pecl/xdebug/* /xd/usr/share/doc/pecl/xdebug/
    cp /usr/lib64/php/modules/xdebug.so /xd/usr/lib64/php/modules/xdebug.so
    chmod -R 777 /xd
    "
tar -czf "${tarball_php_xdebug}" -C target/php-xdebug .

./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball_php_xdebug}"

${PODMAN} rmi -f ${PHP_LS_IMAGE} ${PHP_XDEBUG_IMAGE}
