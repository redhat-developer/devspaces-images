#!/bin/bash -xe
# script to trigger rhpkg after fetching GH release asset files
TARGETDIR=$(cd "$(dirname "$0")"; pwd)
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: --pull-assets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0
PUBLISH_ASSETS=0
DELETE_ASSETS=0

# compute project name from current dir
SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd); 
projectName=${SCRIPT_DIR##*/}; projectName=${projectName/codeready-workspaces-/}; 
if [[ $projectName == "sources" ]]; then # compute a new string
	projectName=$(git config --local remote.origin.url|sed -n 's#.*/\([^.]*\)#\1#p' | sed -e "s#codeready-workspaces-##" -e "s#\.git##")
fi
# echo $projectName

# compute CSV_VERSION from MIDSTM_BRANCH
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-v') CSV_VERSION="$2"; shift 1;;
		'-ght') GITHUB_TOKEN="$2"; shift 1;;
	esac
	shift 1
done

function log()
{
	if [[ ${verbose} -gt 0 ]]; then
	echo "$1"
	fi
}

if [[ ${forceBuild} -eq 1 ]] || [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
	echo "[INFO] #0 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
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
