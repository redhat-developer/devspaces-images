#!/bin/bash -xe

# Copyright (c) 2018-2021 Red Hat, Inc.
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
export GOLANG_IMAGE="registry.access.redhat.com/ubi8/go-toolset:1.15.14-3"
export GOLANG_LINT_VERSION="v1.22.2"
export GOLANG_LS_OLD_DEPS="console-stamp@0.2.9 strip-ansi@5.2.0 has-ansi@4.0.0 ansi-regex@4.1.0 chalk@2.4.2 escape-string-regexp@2.0.0 ansi-styles@4.1.0 supports-color@7.0.0"
export GOLANG_LS_VERSION="0.1.7"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n stacks-golang
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

cd "${SCRIPT_DIR}"
[[ -e target ]] && rm -Rf target

echo ""
echo "Red Hat OpenShift Dev Spaces :: Stacks :: Language Servers :: Golang Dependencies"
echo ""

mkdir -p target/go

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
tarball="${WORKSPACE}/asset-golang-${ARCH}.tar.gz"

# go get LS go deps
${PODMAN} run --rm -v "${SCRIPT_DIR}"/target/go:/opt/app-root/src/go -u root ${GOLANG_IMAGE} sh -c "
    go get -v github.com/stamblerre/gocode;
    go get -v github.com/uudashr/gopkgs/cmd/gopkgs;
    go get -v github.com/ramya-rao-a/go-outline;
    go get -v github.com/acroca/go-symbols;
    go get -v golang.org/x/tools/cmd/guru;
    go get -v golang.org/x/tools/cmd/gorename;
    go get -v github.com/fatih/gomodifytags;
    go get -v github.com/haya14busa/goplay/cmd/goplay;
    go get -v github.com/josharian/impl;
    go get -v golang.org/x/tools/cmd/gotype;
    go get -v github.com/rogpeppe/godef;
    go get -v golang.org/x/tools/cmd/godoc;
    go get -v github.com/zmb3/gogetdoc;
    go get -v golang.org/x/tools/cmd/goimports;
    go get -v sourcegraph.com/sqs/goreturns;
    go get -v golang.org/x/lint/golint;
    go get -v github.com/cweill/gotests/...;
    go get -v honnef.co/go/tools/...;
    go get -v github.com/sourcegraph/go-langserver;
    go get -v github.com/go-delve/delve/cmd/dlv;
    go get -v github.com/davidrjenni/reftools/cmd/fillstruct;
    go get -v golang.org/x/tools/gopls;
    go build -o /go/bin/gocode-gomod github.com/stamblerre/gocode;
    wget -O- -nv https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s ${GOLANG_LINT_VERSION}
    chmod -R 777 /go
    "
tar -czf "${tarball}" -C target go

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball}"

${PODMAN} rmi -f ${GOLANG_IMAGE}
