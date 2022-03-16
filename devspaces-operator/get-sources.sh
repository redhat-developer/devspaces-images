#!/bin/bash -e
# script to get additional dependencies (sources)
#
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: --pull-assets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0

SCRIPT_DIR=$(dirname $(readlink -f "${BASH_SOURCE[0]}"))

DEV_WORKSPACE_CONTROLLER_VERSION="" # main or 0.y.x
DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="" # main or v0.y.z

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'--dwob'|'--dwcv') DEV_WORKSPACE_CONTROLLER_VERSION="$2"; shift 1;;
		'--hrtpb'|'--hrtpv') DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="$2"; shift 1;;
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
function logn()
{
	if [[ ${verbose} -gt 0 ]]; then
	echo -n "$1"
	fi
}

if [[ ${PULL_ASSETS} -eq 1 ]]; then 
	if [[ -x "${SCRIPT_DIR}"/build/scripts/util.sh ]]; then  source "${SCRIPT_DIR}"/build/scripts/util.sh;
	else echo "Error: can't find build/scripts/util.sh in ${SCRIPT_DIR}"; exit 1; fi
	updateDockerfileArgs Dockerfile Dockerfile.2

	set -x
	# step 1 - get zips & repack them
	curl -sSLo asset-devworkspace-operator.zip	 	https://api.github.com/repos/devfile/devworkspace-operator/zipball/${DEV_WORKSPACE_CONTROLLER_VERSION}
	# repack asset-devworkspace-operator.zip - only need /deploy/deployment/ folders
	thisdir=$(pwd)
	dwozip=asset-devworkspace-operator.zip
	unzip -q "${thisdir}/${dwozip}" */deploy/deployment/* -d /tmp/get-sources/
	# mv ${dwozip} ${d/.zip/.big.zip}
	rm -f ${dwozip}
	pushd /tmp/get-sources/ >/dev/null
	zip -q -r9 "${thisdir}/${dwozip}" ./*
	popd >/dev/null
	rm -fr /tmp/get-sources/

	# step 2 - get traefik zip, but do not repack -- need everything
	curl -sSLo asset-header-rewrite-traefik-plugin.zip 	https://api.github.com/repos/che-incubator/header-rewrite-traefik-plugin/zipball/${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}

	# # step 3 - build the builder image to get sources
	# BUILDER=$(command -v podman || true)
	# if [[ ! -x $BUILDER ]]; then
	# 	# echo "[WARNING] podman is not installed, trying with docker"
	# 	BUILDER=$(command -v docker || true)
	# 	if [[ ! -x $BUILDER ]]; then
	# 			echo "[ERROR] must install docker or podman. Abort!"; exit 1
	# 	fi
	# fi
	# DOCKERFILELOCAL=bootstrap.Dockerfile
	# tag=$(pwd);tag=${tag##*/}
	# ${BUILDER} build . -f ${DOCKERFILELOCAL} --target builder -t "${tag}:bootstrap" --no-cache
	# # if needed we can build the bootstrap image to collect a tarball (was needed in <= 2.15)
	# ${BUILDER} run --rm --entrypoint sh "${tag}:bootstrap" -c 'tar -pzcf - /go/path/something' > "asset-path-something.tgz"
	# ${BUILDER} rmi "${tag}:bootstrap"
	set +x
else
	cp Dockerfile Dockerfile.2
fi

if [[ $(git diff-index HEAD --) ]] || [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || \
	[[ ${PULL_ASSETS} -eq 1 ]]; then
	mv -f Dockerfile.2 Dockerfile

	git add bootstrap.Dockerfile || true
	
	log "[INFO] Upload new template source zips: devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION}, header-rewrite-traefik-plugin ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}"
	rhpkg new-sources asset-devworkspace-operator.zip asset-header-rewrite-traefik-plugin.zip
	log "[INFO] Commit new source zips"
	COMMIT_MSG="ci: devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION}, header-rewrite-traefik-plugin ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}"
	if [[ $(git commit -s -m "${COMMIT_MSG}" sources bootstrap.Dockerfile Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi
	if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		echo "[INFO] #1 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 "$tmpfile"
		taskID=$(cat "$tmpfile" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "$tmpfile"
		ERRORS="$(grep "image build failed" "$tmpfile")" && rm -f "$tmpfile"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	# cleanup
	rm -fr Dockerfile.2
	if [[ ${forceBuild} -eq 1 ]]; then
		echo "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 "$tmpfile"
		taskID=$(cat "$tmpfile" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "$tmpfile"
		ERRORS="$(grep "image build failed" "$tmpfile")" && rm -f "$tmpfile"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	else
		log "[INFO] No new sources, so nothing to build."
	fi
fi
