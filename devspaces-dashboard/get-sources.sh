#!/bin/bash -xe
# script to trigger rhpkg after updating vendor folder
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
PULL_ASSETS=0

usage () {
    echo "
Usage:

  $0 [OPTIONS]

Options:

  -n, --nobuild           do not build, even if there's a reason to do so
  -f, --force-build       force a build, even if no reason to do so
  -s, --scratch           do a scratch build

  -p, --pull-assets       create asset file(s)
"
}

if [[ "$#" -eq 0 ]]; then set +x; usage; exit 1; fi

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
	esac
	shift 1
done

function log()
{
	if [[ ${verbose} -gt 0 ]]; then
		echo "$1"
	fi
}

if [[ ${PULL_ASSETS} -eq 1 ]]; then 
	# step one - build the builder image
	BUILDER=$(command -v podman || true)
	if [[ ! -x $BUILDER ]]; then
		# echo "[WARNING] podman is not installed, trying with docker"
		BUILDER=$(command -v docker || true)
		if [[ ! -x $BUILDER ]]; then
				echo "[ERROR] must install docker or podman. Abort!"; exit 1
		fi
	fi

	BOOTSTRAPFILE=./build/dockerfiles/rhel.Dockerfile
	# with yarn 2, no need to change the dockerfile (unlike with go vendoring or yarn 1)
	tag=$(pwd);tag=${tag##*/}
	${BUILDER} build . -f ${BOOTSTRAPFILE} --target builder -t ${tag}:bootstrap # --no-cache

	# step two - extract cache folder to tarball (let's hope there's nothing arch-specific we need here!)
	${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - node_modules packages/*/node_modules' > "asset-node-modules-cache.tgz"
	${BUILDER} rmi ${tag}:bootstrap
    outputFiles=asset-node-modules-cache.tgz
fi

if [[ $(git diff-index HEAD --) ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
	git add sources Dockerfile .gitignore || true
	log "[INFO] Upload new sources: ${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from: ${outputFiles}"
	COMMIT_MSG="ci: ${outputFiles}"
	if [[ $(git commit -s -m "${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
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

