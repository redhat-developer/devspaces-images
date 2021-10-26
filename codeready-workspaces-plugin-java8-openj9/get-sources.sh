#!/bin/bash -xe
# script to get tarball(s) from Jenkins, plus additional dependencies as needed
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
pullAssets=0
generateDockerfileLABELs=1
targetFlag=""
UPSTREAM_JOB_NAME="crw-deprecated_${JOB_BRANCH}" # eg., 2.4
# maven - install 3.6 from https://maven.apache.org/download.cgi
MAVEN_VERSION="3.6.3"
LOMBOK_VERSION="1.18.18"

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-p'|'--pull-assets') pullAssets=1; shift 0;;
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

theTarGzs="
codeready-workspaces-stacks-language-servers-dependencies-node10-s390x.tar.gz
codeready-workspaces-stacks-language-servers-dependencies-python-s390x.tar.gz
codeready-workspaces-stacks-language-servers-dependencies-node10-ppc64le.tar.gz
codeready-workspaces-stacks-language-servers-dependencies-python-ppc64le.tar.gz
"

#### override any existing tarballs with newer ones from Jenkins build
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${JOB_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi

log "[INFO] Download Assets:"
./uploadAssetsToGHRelease.sh --fetch-assets -v "${CSV_VERSION}" --prefix deprecated $theTarGzs

# update Dockerfile to record version we expect for MAVEN_VERSION
sed Dockerfile \
	-e "s#MAVEN_VERSION=\"\([^\"]\+\)\"#MAVEN_VERSION=\"${MAVEN_VERSION}\"#" \
	-e "s#LOMBOK_VERSION=\"\([^\"]\+\)\"#LOMBOK_VERSION=\"${LOMBOK_VERSION}\"#" \
	> Dockerfile.2

# pull maven (if not present, or forced, or new version in dockerfile)
if [[ ! -f apache-maven-${MAVEN_VERSION}-bin.tar.gz ]] || [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${pullAssets} -eq 1 ]]; then
	mv -f Dockerfile.2 Dockerfile
	curl -sSL -O http://mirror.csclub.uwaterloo.ca/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz
	curl -sSL -O https://projectlombok.org/downloads/lombok-${LOMBOK_VERSION}.jar
fi
outputFiles="apache-maven-${MAVEN_VERSION}-bin.tar.gz lombok-${LOMBOK_VERSION}.jar ${theTarGzs}"

log "[INFO] Upload new sources:${theTarGzs}"
rhpkg new-sources ${theTarGzs}
log "[INFO] Commit new sources from:${theTarGzs}"
COMMIT_MSG="Update from GitHub :: Maven ${MAVEN_VERSION} + ${UPSTREAM_JOB_NAME} 
::${theTarGzs}"
if [[ $(git commit -s -m "ci: [get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]] ;then 
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

# cleanup
rm -fr Dockerfile.2
