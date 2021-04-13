#!/bin/bash -xe
# script to pull latest sources from upstream, transform, and commit changes
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
doPull=1
verbose=0

# specific flags for sync.sh
UPDATE_VENDOR=""
SOURCE_BRANCH="main" # or 0.2.x

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
    '-f'|'--force-build') forceBuild=1; shift 0;;
    '-p'|'--force-pull') forcePull=1; shift 0;;
    '-np'|'--no-pull') doPull=0; shift 0;;
    '-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
    '--source-branch'|'-sb') SOURCE_BRANCH="$2"; shift 1;;
    '--no-vendor'|'-nv') UPDATE_VENDOR="--no-vendor";;
    *) JOB_BRANCH="$1"; shift 0;;
  esac
  shift 1
done

function log()
{
  if [[ ${verbose} -gt 0 ]]; then
    echo "$1"
  fi
}

if [[ ${doPull} -eq 1 ]]; then
  if [[ ! ${JOB_BRANCH} ]]; then
    MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  else
    MIDSTM_BRANCH="crw-${JOB_BRANCH}-rhel-8"; if [[ ${JOB_BRANCH} == "2.x" ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
  CSV_VERSION=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION)

  fi
  CSV_VERSION=$(curl -sSLo- https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION)

  SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

  # fetch upstream sources into temp folder
  TMPDIR=$(mktemp -d)
  pushd $TMPDIR >/dev/null
    git clone https://github.com/devfile/devworkspace-operator.git tmp && cd tmp
    git checkout ${SOURCE_BRANCH}
  popd >/dev/null

  chmod +x ./build/scripts/sync.sh
  ./build/scripts/sync.sh -v ${CSV_VERSION}.0 -s ${TMPDIR}/tmp -t ${SCRIPTS_DIR} ${UPDATE_VENDOR}
  # cleanup
  rm -fr ${TMPDIR} bin/ bootstrap.Dockerfile 
fi

git update-index --refresh || true  # ignore timestamp updates
if [[ $(git diff-index HEAD --) ]] || [[ ${forcePull} -ne 0 ]]; then # file changed
  # include any new files...
  git add . -A -f
  if [[ $(git commit -s -m "[get sources] Update sources" Dockerfile .gitignore . || true) == *"nothing to commit, working tree clean"* ]]; then
    log "[INFO] No new sources, so nothing to build."
  elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Push change:"
    git pull; git push
  fi

  if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  fi
else
  if [[ ${forceBuild} -eq 1 ]]; then
    log "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
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

