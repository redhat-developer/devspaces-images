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

# if building a scratch from a private branch, use --target devspaces-*-rhel-8-containers-candidate
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ ${MIDSTM_BRANCH} = "private-"* ]] || [[ ${MIDSTM_BRANCH} != "devspaces-"*"-rhel-"* ]]; then
	if [[ ! $targetFlag ]]; then targetFlag="--target devspaces-3-rhel-8-containers-candidate"; fi
	if [[ ! $scratchFlag ]]; then scratchFlag="--scratch"; fi
fi

if [[ ${forceBuild} -eq 1 ]] || [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
	echo "[INFO] #0 Trigger container-build in current branch: rhpkg container-build ${scratchFlag} ${targetFlag}"
	git status || true
	tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} ${targetFlag} --nowait | tee 2>&1 "${tmpfile}"
	taskID=$(cat "${tmpfile}" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "${tmpfile}"
	ERRORS="$(grep -E "Build failed|image build failed" "${tmpfile}")" && rm -f "${tmpfile}"
	if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

	"; exit 1; fi
else
	echo "[INFO] No build triggered, use -f or --force-build to build in Brew."
fi
