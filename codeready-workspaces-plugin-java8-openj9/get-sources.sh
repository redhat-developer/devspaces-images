#!/bin/bash -xe
# script to get tarball(s) from GitHub Releases, plus additional dependencies as needed
TARGETDIR=$(cd "$(dirname "$0")"; pwd)
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
targetFlag=""
PULL_ASSETS=0
DELETE_ASSETS=0
PUBLISH_ASSETS=0
# maven - install 3.6 from https://maven.apache.org/download.cgi
MAVEN_VERSION="3.6.3"
LOMBOK_VERSION="1.18.22"
ASSET_NAME="plugin-java8-openj9"

while [[ "$#" -gt 0 ]]; do
	case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-d'|'--delete-assets') DELETE_ASSETS=1; shift 0;;
	'-a'|'--publish-assets') PUBLISH_ASSETS=1; shift 0;;
	'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
	'-t'|'--target') targetFlag="--target $2"; shift 1;;
	'-v') CSV_VERSION="$2"; shift 1;;
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

if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi

if [[ ${DELETE_ASSETS} -eq 1 ]]; then
	log "[INFO] Delete ${CSV_VERSION} ${ASSET_NAME} assets and GH release:"
	./uploadAssetsToGHRelease.sh --delete-assets -v "${CSV_VERSION}" -n ${ASSET_NAME}
	exit 0;
fi

if [[ ${PUBLISH_ASSETS} -eq 1 ]]; then
	log "[INFO] Build ${CSV_VERSION} ${ASSET_NAME} assets and publish to GH release:"
	./build/build.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
	exit 0;
fi 

# if not set, compute from current branch
if [[ ! ${JOB_BRANCH} ]]; then 
	JOB_BRANCH=$(git rev-parse --abbrev-ref HEAD); JOB_BRANCH=${JOB_BRANCH//crw-}; JOB_BRANCH=${JOB_BRANCH%%-rhel*}
	if [[ ${JOB_BRANCH} == "2" ]]; then JOB_BRANCH="2.x"; fi
fi

if [[ ${PULL_ASSETS} -eq 1 ]]; then
	#### override any existing tarballs with newer ones from asset build
	log "[INFO] Download ${CSV_VERSION} ${ASSET_NAME} assets:"
	REPO_PATH=""
	if [[ -d ${WORKSPACE}/sources/ ]]; then REPO_PATH="--repo-path ${WORKSPACE}/sources"; fi
	./uploadAssetsToGHRelease.sh --pull-assets -v "${CSV_VERSION}" -n ${ASSET_NAME} ${REPO_PATH} --target "${TARGETDIR}"

	#get names of the downloaded tarballs
	theTarGzs="$(ls *.tar.gz)"

	# update Dockerfile to record version we expect for MAVEN_VERSION
	sed Dockerfile \
		-e "s#MAVEN_VERSION=\"\([^\"]\+\)\"#MAVEN_VERSION=\"${MAVEN_VERSION}\"#" \
		-e "s#LOMBOK_VERSION=\"\([^\"]\+\)\"#LOMBOK_VERSION=\"${LOMBOK_VERSION}\"#" \
		> Dockerfile.2

	# pull maven and lobok if either is not present, or if forced, or new version in dockerfile
	if [[ ! -f apache-maven-${MAVEN_VERSION}-bin.tar.gz ]] || [[ ! -f lombok-${LOMBOK_VERSION}.jar ]] || \
		[[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
		mv -f Dockerfile.2 Dockerfile
		curl -sSL -O http://mirror.csclub.uwaterloo.ca/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz
		curl -sSL -O https://github.com/redhat-developer/codeready-workspaces-images/releases/download/${CSV_VERSION}-noarch-assets/lombok-${LOMBOK_VERSION}.jar
	fi
	outputFiles="apache-maven-${MAVEN_VERSION}-bin.tar.gz lombok-${LOMBOK_VERSION}.jar ${theTarGzs}"
	log "[INFO] Upload new sources: ${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from: ${outputFiles}"
	COMMIT_MSG="ci: GH ${ASSET_NAME} + noarch assets :: ${outputFiles}"
	if [[ $(git commit -s -m "${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi
	if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		echo "[INFO] #1 Trigger container-build in current branch: rhpkg container-build ${targetFlag} ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${targetFlag} ${scratchFlag} --nowait | tee 2>&1 $tmpfile
		taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
		ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	if [[ ${forceBuild} -eq 1 ]]; then
		echo "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${targetFlag} ${scratchFlag}"
		git status || true
		tmpfile=$(mktemp) && rhpkg container-build ${targetFlag} ${scratchFlag} --nowait | tee 2>&1 $tmpfile
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
