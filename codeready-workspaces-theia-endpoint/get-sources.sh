#!/bin/bash -xe
# script to get tarball(s) from Quay
# TODO enable delete/publish/pull from GH releases instead of temp images in Quay
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0
PUBLISH_ASSETS=0
DELETE_ASSETS=0

# compute ASSET_NAME from current dir
SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd); 
ASSET_NAME=${SCRIPT_DIR##*/}; projectName=${projectName/codeready-workspaces-/}; 
if [[ $ASSET_NAME == "sources" ]]; then # compute a new string
	ASSET_NAME=$(git config --local remote.origin.url|sed -n 's#.*/\([^.]*\)#\1#p' | sed -e "s#codeready-workspaces-##" -e "s#\.git##")
fi
# echo $ASSET_NAME

# compute CSV_VERSION from MIDSTM_BRANCH
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
CSV_VERSION=$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces-images/${MIDSTM_BRANCH}/codeready-workspaces-operator-metadata/manifests/codeready-workspaces.csv.yaml" | yq -r .spec.version)

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-d'|'--delete-assets') DELETE_ASSETS=1; exit 0;;  # TODO switch to shift 0 when we have a way to use GH releases for Theia asset files
		'-a'|'--publish-assets') PUBLISH_ASSETS=1; exit 0;; # TODO switch to shift 0 when we have a way to use GH releases for Theia asset files
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

# TODO enable this when we have a way to use GH releases for Theia asset files
# if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
#     curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
# fi

# if [[ ${DELETE_ASSETS} -eq 1 ]]; then
# 	log "[INFO] Delete ${CSV_VERSION} ${ASSET_NAME} assets and GH release:"
# 	./uploadAssetsToGHRelease.sh --delete-assets -v "${CSV_VERSION}" -n ${ASSET_NAME}
# 	exit 0;
# fi

# if [[ ${PUBLISH_ASSETS} -eq 1 ]]; then
# 	log "[INFO] Build ${CSV_VERSION} ${ASSET_NAME} assets and publish to GH release:"
# 	./build/TODO.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
# 	exit 0;
# fi

OLD_SHA="$(git rev-parse --short=4 HEAD)"
if [[ ${PULL_ASSETS} -eq 1 ]]; then 
  # collect assets. NOTE: target folder must end in theia-dev/, theia/ or theia-endpoint/ to auto-compute what to collect; 
  # otherwise an override flag is needed: -d, --theia-dev, -t, --theia, -e, --theia-endpoint
  ./build/scripts/collect-assets.sh --cb ${MIDSTM_BRANCH} --target $(pwd)/ --rmi:tmp --ci --commit
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
