#!/bin/bash -xe
# script to trigger rhpkg (no assets to fetch)
#
scratchFlag=""
targetFlag=""
doRhpkgContainerBuild=1
forceBuild=0

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-p'|'--pull-assets') exit 0; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'--target') targetFlag="--target $2"; shift 1;;
		'-v') CSV_VERSION="$2"; shift 1;;
		'-ght') exit 0; shift 1;;
	esac
	shift 1
done

if [[ ${forceBuild} -eq 1 ]] || [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
	echo "[INFO] #0 Trigger container-build in current branch: rhpkg container-build ${scratchFlag} ${targetFlag}"
	git status || true
	tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} ${targetFlag} --nowait | tee 2>&1 "${tmpfile}"
	taskID=$(cat "${tmpfile}" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "${tmpfile}"
	ERRORS="$(grep "image build failed" "${tmpfile}")" && rm -f "${tmpfile}"
	if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

	"; exit 1; fi
else
	echo "[INFO] No build triggered, use -f or --force-build to build in Brew."
fi
