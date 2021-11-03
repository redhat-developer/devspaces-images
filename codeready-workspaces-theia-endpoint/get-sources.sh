#!/bin/bash -xe
# script to get tarball(s) from quay
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: --pull-assets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0

while [[ "$#" -gt 0 ]]; do
  case $1 in
  '-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
  '-a'|'--publish-assets') exit 0; shift 0;;
  '-d'|'--delete-assets') exit 0; shift 0;;
  '-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
  '-f'|'--force-build') forceBuild=1; shift 0;;
  '-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
  '-v') CSV_VERSION="$2"; shift 1;;
  *) JOB_BRANCH="$1"; shift 0;;
  esac
  shift 1
done

# if not set, compute from current branch
if [[ ! ${JOB_BRANCH} ]]; then 
  DWNSTM_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  JOB_BRANCH=${DWNSTM_BRANCH//crw-}; JOB_BRANCH=${JOB_BRANCH%%-rhel*}
else
  if [[ ${JOB_BRANCH} == "2.x" ]]; then 
    DWNSTM_BRANCH="crw-2-rhel-8"
  else
    DWNSTM_BRANCH="crw-${JOB_BRANCH}-rhel-8"
  fi
fi
if [[ ${JOB_BRANCH} == "2" ]]; then JOB_BRANCH="2.x"; fi
# echo "Got DWNSTM_BRANCH=${DWNSTM_BRANCH} and JOB_BRANCH=${JOB_BRANCH}"

function log()
{
  if [[ ${verbose} -gt 0 ]]; then
    echo "$1"
  fi
}

OLD_SHA="$(git rev-parse --short=4 HEAD)"
if [[ ${PULL_ASSETS} -eq 1 ]]; then 
  # collect assets. NOTE: target folder must end in theia-dev/, theia/ or theia-endpoint/ to auto-compute what to collect; 
  # otherwise an override flag is needed: -d, --theia-dev, -t, --theia, -e, --theia-endpoint
  ./build/scripts/collect-assets.sh --cb ${DWNSTM_BRANCH} --target $(pwd)/ --rmi:tmp --ci --commit
fi
NEW_SHA="$(git rev-parse --short=4 HEAD)"

if [[ "${OLD_SHA}" != "${NEW_SHA}" ]]; then
  if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    echo "[INFO] #1 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    git status || true
    tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  fi
else
  if [[ ${forceBuild} -eq 1 ]]; then
    echo "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    git status || true
    tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  else
    log "[INFO] No new sources, so nothing to build."
  fi
fi
