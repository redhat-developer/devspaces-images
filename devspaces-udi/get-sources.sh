#!/bin/bash -xe
# script to build/fetch sources, then trigger rhpkg 
TARGETDIR=$(cd "$(dirname "$0")"; pwd)
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
PULL_ASSETS=0
DELETE_ASSETS=0
PUBLISH_ASSETS=0
ASSET_NAME="udi"

while [[ "$#" -gt 0 ]]; do
	case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
	'-d'|'--delete-assets') DELETE_ASSETS=1; shift 0;;
	'-a'|'--publish-assets') PUBLISH_ASSETS=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
	'-v') CSV_VERSION="$2"; shift 1;;
	esac
	shift 1
done

function log()
{
	if [[ ${verbose} -gt 0 ]]; then
		echo "$1"
	fi
}

if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi

if [[ ${DELETE_ASSETS} -eq 1 ]]; then
	log "[INFO] Delete ${CSV_VERSION} ${ASSET_NAME} assets and GH release:"
	./uploadAssetsToGHRelease.sh --delete-assets -v "${CSV_VERSION}" -n ${ASSET_NAME} || true
	exit 0;
fi

if [[ ${PUBLISH_ASSETS} -eq 1 ]]; then
	log "[INFO] Build ${CSV_VERSION} ${ASSET_NAME} assets and publish to GH release:"
	./build/build.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
	exit 0
fi

if [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
    rm -fr asset-*
	mv -f Dockerfile.2 Dockerfile

    log "[INFO] Download ${CSV_VERSION} ${ASSET_NAME} assets:"
	REPO_PATH=""
	if [[ -d ${WORKSPACE}/sources/ ]]; then REPO_PATH="--repo-path ${WORKSPACE}/sources"; fi

	# pull asset-*.tar.gz files
	./uploadAssetsToGHRelease.sh --pull-assets -v "${CSV_VERSION}" -n ${ASSET_NAME} ${REPO_PATH} --target "${TARGETDIR}"

    outputFiles="$(ls asset-*.tar.gz)"

	# cleanup
	rm -f Dockerfile.2 uploadAssetsToGHRelease.sh

	log "[INFO] Upload new sources: ${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from: ${outputFiles}"
	COMMIT_MSG="ci: GH ${ASSET_NAME} assets :: ${outputFiles}"

	if [[ $(git commit -s -m "${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi
	if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		echo "[INFO] #1 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 "$tmpfile"
		# shellcheck disable=SC2002
		taskID=$(cat "$tmpfile" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs "$taskID" | tee 2>&1 "$tmpfile"
		ERRORS="$(grep "image build failed" "$tmpfile")" && rm -f "$tmpfile"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	# cleanup
	rm -f Dockerfile.2 uploadAssetsToGHRelease.sh
	if [[ ${forceBuild} -eq 1 ]]; then
		echo "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 "$tmpfile"
		# shellcheck disable=SC2002
		taskID=$(cat "$tmpfile" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs "$taskID" | tee 2>&1 "$tmpfile"
		ERRORS="$(grep "image build failed" "$tmpfile")" && rm -f "$tmpfile"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	else
		log "[INFO] No new sources, so nothing to build."
	fi
fi
