#!/bin/bash -xe
# script to get additional dependencies (sources)
# 
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0

DEV_WORKSPACE_CONTROLLER_VERSION="0.6.x" # main or 0.y.x
# TODO remove DWCO when it's no longer needed (merged into che-operator)
DEV_WORKSPACE_CHE_OPERATOR_VERSION="7.32.x" # main or 7.yy.x

while [[ "$#" -gt 0 ]]; do
	case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-p'|'--force-pull') forcePull=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
	'--dwob'|'--dwcv') DEV_WORKSPACE_CONTROLLER_VERSION="$2"; shift 1;;
	'--dwcob'|'--dwcov') DEV_WORKSPACE_CHE_OPERATOR_VERSION="$2"; shift 1;;
	*) JOB_BRANCH="$1"; shift 0;;
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

# if not set, compute from current branch
if [[ ! ${JOB_BRANCH} ]]; then 
	JOB_BRANCH=$(git rev-parse --abbrev-ref HEAD); JOB_BRANCH=${JOB_BRANCH//crw-}; JOB_BRANCH=${JOB_BRANCH%%-rhel*}
	if [[ ${JOB_BRANCH} == "2" ]]; then JOB_BRANCH="2.x"; fi
fi


# update Dockerfile to record version we expect for DEV_WORKSPACE_CHE_OPERATOR_VERSION and DEV_WORKSPACE_CONTROLLER_VERSION
# CRW-1674 this step also done in crw-operator_2.*.jenkinsfile
sed Dockerfile -r \
	-e 's#DEV_WORKSPACE_CONTROLLER_VERSION="([^"]+)"#DEV_WORKSPACE_CONTROLLER_VERSION="'${DEV_WORKSPACE_CONTROLLER_VERSION}'"#' \
	-e 's#DEV_WORKSPACE_CHE_OPERATOR_VERSION="([^"]+)"#DEV_WORKSPACE_CHE_OPERATOR_VERSION="'${DEV_WORKSPACE_CHE_OPERATOR_VERSION}'"#' \
	> Dockerfile.2

# pull maven (if not present, or forced, or new version in dockerfile)
if [[ ! $(find -name "devworkspace*operator.zip") ]] || [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${forcePull} -eq 1 ]]; then
	mv -f Dockerfile.2 Dockerfile

	curl -sSLo devworkspace-operator.zip		 https://api.github.com/repos/devfile/devworkspace-operator/zipball/${DEV_WORKSPACE_CONTROLLER_VERSION}
	curl -sSLo devworkspace-che-operator.zip https://api.github.com/repos/che-incubator/devworkspace-che-operator/zipball/${DEV_WORKSPACE_CHE_OPERATOR_VERSION}

	# unzip zips and remove all but what we need
	thisdir=$(pwd)
	for d in devworkspace-operator.zip devworkspace-che-operator.zip; do 
		# we only need the /deploy/deployment/ folders
		unzip -q ${thisdir}/${d} */deploy/deployment/* -d /tmp/get-sources/
		# mv ${d} ${d/.zip/.big.zip}
		rm -f ${d}
		pushd /tmp/get-sources/ >/dev/null
		zip -q -r9 ${thisdir}/${d} ./*
		popd >/dev/null
		rm -fr /tmp/get-sources/
	done

	log "[INFO] Upload new template source zips: devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION} and devworkspace-che-operator ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}"
	rhpkg new-sources devworkspace*operator.zip
	log "[INFO] Commit new source zips"
	COMMIT_MSG="devworkspace-operator ${DEV_WORKSPACE_CONTROLLER_VERSION}, devworkspace-che-operator ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
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

# cleanup
rm -fr Dockerfile.2
