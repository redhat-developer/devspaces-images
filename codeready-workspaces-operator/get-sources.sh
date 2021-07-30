#!/bin/bash -e
# script to get additional dependencies (sources)
#
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: pullAssets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
pullAssets=0

DEV_WORKSPACE_CONTROLLER_VERSION="" # main or 0.y.x
DEV_WORKSPACE_CHE_OPERATOR_VERSION="" # main or 7.yy.x 
# TODO remove DWCO when it's no longer needed (merged into che-operator)
DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="" # main or v0.y.z
RESTIC_VERSION=$(sed -n 's|.*RESTIC_TAG=\(.*\)|\1|p' Dockerfile)

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') pullAssets=1; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'--dwob'|'--dwcv') DEV_WORKSPACE_CONTROLLER_VERSION="$2"; shift 1;;
		'--dwcob'|'--dwcov') DEV_WORKSPACE_CHE_OPERATOR_VERSION="$2"; shift 1;;
		'--hrtpb'|'--hrtpv') DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="$2"; shift 1;;
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

if [[ ${pullAssets} -eq 1 ]]; then 
	# step one - build the builder image
	BUILDER=$(command -v podman || true)
	if [[ ! -x $BUILDER ]]; then
		# echo "[WARNING] podman is not installed, trying with docker"
		BUILDER=$(command -v docker || true)
		if [[ ! -x $BUILDER ]]; then
				echo "[ERROR] must install docker or podman. Abort!"; exit 1
		fi
	fi
	
	# if not set via commandline, compute DEV_WORKSPACE_CONTROLLER_VERSION, DEV_WORKSPACE_CHE_OPERATOR_VERSION  and DEV_HEADER_REWRITE_TRAEFIK_PLUGIN
	# from https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/VERSION.json
	# shellcheck disable=SC2086
	if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]] || [[ -z "${DEV_WORKSPACE_CHE_OPERATOR_VERSION}" ]] || [[ -z "${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}" ]]; then
		MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
		if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
		versionjson="$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json")"
		if [[ $versionjson == *"404"* ]] || [[ $versionjson == *"Not Found"* ]]; then 
			echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json"
			echo "[ERROR] Please use --dwob flag to set DEV_WORKSPACE_CONTROLLER_VERSION"
			echo "[ERROR] Please use --dwcob flag to set DEV_WORKSPACE_CHE_OPERATOR_VERSION"
			echo "[ERROR] Please use --hrtpb flag to set DEV_HEADER_REWRITE_TRAEFIK_PLUGIN"
			exit 1
		fi
		if [[ $MIDSTM_BRANCH == "crw-2-rhel-8" ]]; then
			CRW_VERSION="$(echo "$versionjson" | jq -r '.Version')"
		else 
			CRW_VERSION=${MIDSTM_BRANCH/crw-/}; CRW_VERSION=${CRW_VERSION//-rhel-8}
		fi
		if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]]; then
			DEV_WORKSPACE_CONTROLLER_VERSION="$(echo "$versionjson" | jq -r '.Jobs["devworkspace-controller"]."'${CRW_VERSION}'"')"
			if [[ ${DEV_WORKSPACE_CONTROLLER_VERSION} == "null" ]]; then DEV_WORKSPACE_CONTROLLER_VERSION="main"; fi
		fi
		if [[ -z "${DEV_WORKSPACE_CHE_OPERATOR_VERSION}" ]]; then
			DEV_WORKSPACE_CHE_OPERATOR_VERSION="$(echo "$versionjson" | jq -r '.Jobs["devworkspace"]."'${CRW_VERSION}'"')"
			if [[ ${DEV_WORKSPACE_CHE_OPERATOR_VERSION} == "null" ]]; then DEV_WORKSPACE_CHE_OPERATOR_VERSION="main"; fi
		fi
		if [[ -z "${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}" ]]; then
			DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="$(echo "$versionjson" | jq -r '.Other["DEV_HEADER_REWRITE_TRAEFIK_PLUGIN"]."'${CRW_VERSION}'"')"
			if [[ ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN} == "null" ]]; then DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="main"; fi
		fi
	fi
	# echo "[INFO] For ${CRW_VERSION} / ${MIDSTM_BRANCH}:"
	# echo "[INFO]   DEV_WORKSPACE_CONTROLLER_VERSION   = ${DEV_WORKSPACE_CONTROLLER_VERSION}"
	# echo "[INFO]   DEV_WORKSPACE_CHE_OPERATOR_VERSION = ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}"
	# echo "[INFO]   DEV_HEADER_REWRITE_TRAEFIK_PLUGIN  = ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}"
	# exit

	DOCKERFILELOCAL=bootstrap.Dockerfile
	tag=$(pwd);tag=${tag##*/}
	${BUILDER} build . -f ${DOCKERFILELOCAL} --target builder -t "${tag}:bootstrap" --no-cache
	# rm -f ${DOCKERFILELOCAL}

	# step two - extract restic sources AND nested vendor folder to tarball
	${BUILDER} run --rm --entrypoint sh "${tag}:bootstrap" -c 'tar -pzcf - /go/restic' > "asset-restic.tgz"
	${BUILDER} rmi "${tag}:bootstrap"

	# step three - get other zips & repack them
	curl -sSLo asset-devworkspace-operator.zip	 	https://api.github.com/repos/devfile/devworkspace-operator/zipball/${DEV_WORKSPACE_CONTROLLER_VERSION}
	curl -sSLo asset-devworkspace-che-operator.zip 	https://api.github.com/repos/che-incubator/devworkspace-che-operator/zipball/${DEV_WORKSPACE_CHE_OPERATOR_VERSION}
	# repack asset-devworkspace-operator.zip asset-devworkspace-che-operator.zip - only need /deploy/deployment/ folders
	thisdir=$(pwd)
	for d in asset-devworkspace-operator.zip asset-devworkspace-che-operator.zip; do
		unzip -q "${thisdir}/${d}" */deploy/deployment/* -d /tmp/get-sources/
		# mv ${d} ${d/.zip/.big.zip}
		rm -f ${d}
		pushd /tmp/get-sources/ >/dev/null
		zip -q -r9 "${thisdir}/${d}" ./*
		popd >/dev/null
		rm -fr /tmp/get-sources/
	done

	# step four - get traefik zip, but do not repack -- need everything
	curl -sSLo asset-header-rewrite-traefik-plugin.zip 	https://api.github.com/repos/che-incubator/header-rewrite-traefik-plugin/zipball/${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}
fi

# update Dockerfile to record version we expect for DEV_WORKSPACE_CHE_OPERATOR_VERSION, DEV_WORKSPACE_CONTROLLER_VERSION and DEV_HEADER_REWRITE_TRAEFIK_PLUGIN
# CRW-1674 this step also done in crw-operator_2.*.jenkinsfile
sed Dockerfile -r \
	-e 's#DEV_WORKSPACE_CONTROLLER_VERSION="([^"]+)"#DEV_WORKSPACE_CONTROLLER_VERSION="'${DEV_WORKSPACE_CONTROLLER_VERSION}'"#' \
	-e 's#DEV_WORKSPACE_CHE_OPERATOR_VERSION="([^"]+)"#DEV_WORKSPACE_CHE_OPERATOR_VERSION="'${DEV_WORKSPACE_CHE_OPERATOR_VERSION}'"#' \
	-e 's#DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="([^"]+)"#DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="'${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}'"#' \
	> Dockerfile.2

if [[ $(git diff-index HEAD --) ]] || [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || \
	[[ ${pullAssets} -eq 1 ]]; then
	mv -f Dockerfile.2 Dockerfile

	git add bootstrap.Dockerfile || true
	
	log "[INFO] Upload new template source zips: devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION}, devworkspace-che-operator ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}, header-rewrite-traefik-plugin ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN} and restic ${RESTIC_VERSION} w/ vendor folder"
	rhpkg new-sources asset-devworkspace*operator.zip asset-header-rewrite-traefik-plugin.zip asset-restic.tgz
	log "[INFO] Commit new source zips"
	COMMIT_MSG="devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION}, devworkspace-che-operator ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}, header-rewrite-traefik-plugin ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}, restic ${RESTIC_VERSION}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources bootstrap.Dockerfile Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
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
