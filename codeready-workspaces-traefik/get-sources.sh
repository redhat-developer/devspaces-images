#!/bin/bash -xe
# script to trigger rhpkg after fetching GH release asset files
#
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: pullAssets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
pullAssets=0

# compute project name from current dir
SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd); 
projectName=${SCRIPT_DIR##*/}; projectName=${projectName/codeready-workspaces-/}; echo $projectName

# compute CSV_VERSION from MIDSTM_BRANCH
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
CSV_VERSION=$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces-images/${MIDSTM_BRANCH}/codeready-workspaces-operator-metadata/manifests/codeready-workspaces.csv.yaml" | yq -r .spec.version)

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') pullAssets=1; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-v') CSV_VERSION="$2"; shift 1;;
		'-b') MIDSTM_BRANCH="$2"; shift 1;;
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
function logn()
{
	if [[ ${verbose} -gt 0 ]]; then
	echo -n "$1"
	fi
}

curlWithToken()
{
  curl -sSL -H "Authorization:token ${GITHUB_TOKEN}" "$1" "$2" "$3"
}

# check if existing release exists
releases_URL="https://api.github.com/repos/redhat-developer/codeready-workspaces-images/releases"
# shellcheck disable=2086
RELEASE_ID=$(curlWithToken -H "Accept: application/vnd.github.v3+json" $releases_URL | jq -r --arg CSV_VERSION "${CSV_VERSION}" --arg projectName "${projectName}" '.[] | select(.name=="Assets for the '$CSV_VERSION' '$projectName' release")|.url' || true); RELEASE_ID=${RELEASE_ID##*/}
if [[ -z $RELEASE_ID ]]; then 
	echo "ERROR: could not compute RELEASE_ID from which to collect assets! Check https://api.github.com/repos/redhat-developer/codeready-workspaces-images/releases"
	exit 1
fi

# get the public URLs for the tarball(s) from browser_download_url
theTarGzs="$(curlWithToken https://api.github.com/repos/redhat-developer/codeready-workspaces-images/releases/${RELEASE_ID} | jq -r '.assets[].browser_download_url')"

#### override any existing tarballs with newer ones from Jenkins build
for theTarGz in ${theTarGzs}; do
	log "[INFO] Download ${theTarGz} -> ${theTarGz##*/}"
	# TODO can we check if we already have the identical file before re-downloading it? eg., store sha512sums as assets files?
	if [[ ! -f ./${theTarGz##*/} ]] || [[ ${pullAssets} -eq 1 ]]; then 
		if [[ -f ./${theTarGz##*/} ]]; then rm -f ./${theTarGz##*/}; fi
		curl -sSLo ./${theTarGz##*/} ${theTarGz}
		outputFiles="${outputFiles} ${theTarGz##*/}"
	fi
done

if [[ ${outputFiles} ]]; then
	log "[INFO] Upload new sources: ${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from:${outputFiles}"
	COMMIT_MSG="GH releases :: ${outputFiles}"
	if [[ $(git commit -s -m "ci: [get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi
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
