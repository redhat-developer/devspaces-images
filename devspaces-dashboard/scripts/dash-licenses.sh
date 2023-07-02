#!/bin/bash

set -e

usage() {
  cat <<EOF
This scripts helps to run a wrapper for The Eclipse Dash License Tool that allows easily to generate
dependencies files with container image without the need to compile dash-licenses jar.

Arguments:
  -c|--check : This option allows to check all dependencies without creating any new files in the project
                 directory (except a temporary one) but checks if the dependencies info is up-to-date and
                 then validates all found dependencies.

Examples:
$0
$0 --check
EOF
}


parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
    '-c' | '--check')
      CHECK="true"
      shift 0
      ;;
    '--help')
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown parameter is used: $1."
      usage
      exit 1
      ;;
    esac
    shift 1
  done
}

if [[ -z "$(ps aux | grep -v grep | grep docker)" ]]; then
  echo "[INFO] Using Podman platform."
  TARGET_COMMAND='podman'
else
  echo "[INFO] Using Docker platform."
  TARGET_COMMAND='docker'
fi

if [ "$CHECK" == "true" ]; then
  echo "[INFO] Check dependencies."
  $TARGET_COMMAND run --rm -t -v ${PWD}/:/workspace/project quay.io/che-incubator/dash-licenses@sha256:72290f67f297a31b7b9b343d19f42cc0ecc90e1d36cc9f18473c586a70e4b7eb --check
else
   echo "[INFO] Generate dependencies info."
   $TARGET_COMMAND run --rm -t -v "${PWD}"/:/workspace/project quay.io/che-incubator/dash-licenses:next
fi

echo '[INFO] Done.'
