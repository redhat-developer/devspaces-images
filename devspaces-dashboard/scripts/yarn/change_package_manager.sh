#!/bin/sh
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# The script is used to change current package manager(yarn 1 vs yarn 3)

OLD_VERSION_DIR=$(pwd)/scripts/yarn/old_version
TMP_DIR=$(pwd)/scripts/yarn/tmp

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

#==========================Clean temporary directory============================
if [ -d $TMP_DIR ]; then
    echo "[INFO]: Clean temporary directory"
    rm -rf $TMP_DIR
else
    echo "[INFO]: Create temporary directory"
fi
mkdir -p $TMP_DIR
#==========================Store origin files==================================
if [ -f "$(pwd)/.yarnrc.yml" ]; then
    echo "[INFO]: Move '.yarnrc.yml' file to the temporary directory"
    mv -f $(pwd)/.yarnrc.yml $TMP_DIR
fi

if [ -f "$(pwd)/.yarnrc" ]; then
    echo "[INFO]: Move '.yarnrc' file to the temporary directory"
    mv -f $(pwd)/.yarnrc $TMP_DIR
fi

if [ -d "$(pwd)/.yarn" ]; then
    echo "[INFO]: Move '.yarn' dir to the temporary directory"
    mv -f $(pwd)/.yarn $TMP_DIR/
fi

if [ -f "$(pwd)/yarn.lock" ]; then
    echo "[INFO]: Move 'yarn.lock' file to the temporary directory"
    mv -f $(pwd)/yarn.lock $TMP_DIR
fi

if [ -d "$(pwd)/.deps" ]; then
    echo "[INFO]: Move '.deps' dir to the temporary directory"
    mv -f $(pwd)/.deps $TMP_DIR/
fi
#==========================Restore old version=================================
if [ -d $OLD_VERSION_DIR ]; then
    echo "[INFO]: Restore old package manager version"
    find "$OLD_VERSION_DIR" -mindepth 1 -maxdepth 1 -exec mv -f {} $(pwd)/ \;
fi
#==========================Cleanup=============================================
if [ -d $TMP_DIR ]; then
    echo "[INFO]: Cleanup"
    find "$TMP_DIR" -mindepth 1 -maxdepth 1 -exec mv -f {} "$OLD_VERSION_DIR"/ \;
fi

#==========================Check current version================================
VER=$(yarn --cwd $(pwd) -v | sed -e s/\\./\\n/g | sed -n 1p)

if [ -z "$VER" ]; then
    echo "${RED}[ERROR]: Unable to get the current version of yarn. Please check the yarn installation.${NC}"
    exit 1
else
    echo "${GREEN}**********************${NC}"
    echo "${GREEN}*****   Yarn $VER   *****${NC}"
    echo "${GREEN}**********************${NC}"
fi

exit 0
