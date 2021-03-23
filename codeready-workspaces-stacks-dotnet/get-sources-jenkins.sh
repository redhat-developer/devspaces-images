#!/bin/bash -xe
# script to trigger rhpkg - no sources needed here

scratchFlag=""
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-p'|'--force-pull') shift 0;;
    '-n'|'--nobuild') exit 0; shift 0;;
    '-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
  esac
  shift 1
done

echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
