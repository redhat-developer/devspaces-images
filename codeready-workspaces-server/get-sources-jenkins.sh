#!/bin/bash -xe
# script to get tarball(s) from Jenkins, plus additional dependencies as needed
# 
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
	*) JOB_BRANCH="$1"; shift 0;;
  esac
  shift 1
done

# build che server with maven
mvn -B clean install
# tarball created in ${TARGETDIR}/assembly/assembly-main/target/eclipse-che-*.tar.gz
mv assembly/assembly-main/target/eclipse-che-*.tar.gz asset-server.tgz
outputFiles="asset-server.tgz"

if [[ ${outputFiles} ]]; then
	echo "[INFO] Upload new sources:${outputFiles}"
	rhpkg new-sources ${outputFiles}
	echo "[INFO] Commit new sources from:${outputFiles}"
	COMMIT_MSG="Update from Maven :: ${UPSTREAM_JOB_NAME}
::${outputFiles}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
		echo "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		echo "[INFO] Push change:"
		git pull; git push
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
		echo "[INFO] No new sources, so nothing to build."
	fi
fi
