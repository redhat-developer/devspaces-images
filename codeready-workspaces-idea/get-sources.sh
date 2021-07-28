#!/bin/bash -xe
# script to trigger rhpkg after updating vendor folder
#
verbose=1
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: pullAssets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
pullAssets=0

idePackagingUrl=https://download-cdn.jetbrains.com/idea/ideaIC-2020.3.3.tar.gz

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') pullAssets=1; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
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
  ./projector.sh build --prepare --url $idePackagingUrl

  if [[ ! -f "ide-packaging" ]]; then
    log "[ERROR] 'ide-packaging' not found, so nothing to build."
    exit 1;
  fi

  if [[ ! -f "projector-server-assembly" ]]; then
    log "[ERROR] 'projector-server-assembly' not found, so nothing to build."
    exit 1;
  fi

  if [[ ! -f "static-assembly" ]]; then
    log "[ERROR] 'static-assembly' not found, so nothing to build."
    exit 1;
  fi

  outputFiles="ide-packaging projector-server-assembly static-assembly"
fi

if [[ $(git diff-index HEAD --) ]] || [[ ${pullAssets} -eq 1 ]]; then
	git add sources Dockerfile .gitignore || true
	outputFilesRenamed=""
	for f in ${outputFiles}; do # rename files to be consistent with CRW conventions
	  mv $f asset-${f}.tgz
	  outputFilesRenamed="${outputFilesRenamed}asset-${f}.tgz "
	done
	outputFiles="${outputFilesRenamed}"
	log "[INFO] Upload new sources: ${outputFiles}"
	# shellcheck disable=SC2086
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from: ${outputFiles}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
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