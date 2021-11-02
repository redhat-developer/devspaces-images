#!/bin/bash -xe
# script to trigger rhpkg - no sources needed here

scratchFlag=""
# NOTE: pullAssets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
pullAssets=0

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-n'|'--nobuild') exit 0; shift 0;;
		'-p'|'--pull-assets') pullAssets=1; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-v') CSV_VERSION="$2"; shift 1;;
	esac
	shift 1
done

echo "[INFO] #0 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
git status || true
tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
