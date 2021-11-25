#!/bin/bash -xe
# script to trigger rhpkg after updating vendor folder
#
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: --pull-assets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0

resticRestServerAssets=assets-rest-server.tgz

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-v') CSV_VERSION="$2"; shift 1;;
	esac
	shift 1
done

function log() {
	if [[ ${verbose} -gt 0 ]]; then
  	echo "$1"
	fi
}

if [[ ${PULL_ASSETS} -eq 1 ]]; then
	BUILDER=$(command -v podman || true)
	if [[ ! -x $BUILDER ]]; then
		# echo "[WARNING] podman is not installed, trying with docker"
		BUILDER=$(command -v docker || true)
		if [[ ! -x $BUILDER ]]; then
				echo "[ERROR] must install docker or podman. Abort!"; exit 1
		fi
	fi

  # Use the upstream dockerfile for bootstrap as the build is happening in builder container
	BOOTSTRAP_DOCKERFILE='bootstrap.Dockerfile'
	imageName=$(pwd);imageName=${imageName##*/}
	${BUILDER} build . -f ${BOOTSTRAP_DOCKERFILE} --target builder -t ${imageName}:bootstrap --no-cache
	# Extract vendor folder to tarball (let's hope there's nothing arch-specific we need here!)
	${BUILDER} run --rm --entrypoint sh ${imageName}:bootstrap -c 'tar -pzcf - /tmp/go/rest-server/' > ${resticRestServerAssets}
	${BUILDER} rmi ${imageName}:bootstrap
fi

if [[ $(git diff-index HEAD --) ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
	git add sources Dockerfile .gitignore || true
	log "[INFO] Upload new sources: ${resticRestServerAssets}"
	rhpkg new-sources ${resticRestServerAssets}
	log "[INFO] Commit new sources from: ${resticRestServerAssets}"
	COMMIT_MSG="ci: ${resticRestServerAssets}"
	if [[ $(git commit -s -m "${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi
fi

if [[ ${doRhpkgContainerBuild} -eq 1 ]] || [[ ${forceBuild} -eq 1 ]]; then
	echo "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
	git status || true
	tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
	taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
	ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
	if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1;
  fi
else
  log "[INFO] No new sources, so nothing to build."
fi
