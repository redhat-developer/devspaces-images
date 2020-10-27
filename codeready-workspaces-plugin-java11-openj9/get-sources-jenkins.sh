#!/bin/bash -xe
# script to get tarball(s) from Jenkins, plus additional dependencies as needed
# 
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
targetFlag=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-p'|'--force-pull') forcePull=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
	'-t'|'--target') targetFlag="--target $2"; shift 1;;
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

if [ -z "$JOB_BRANCH" ] ; then
		log "[ERROR] JOB_BRANCH was not specified"
		exit 1
fi
# if [[ ! ${targetFlag} ]]; then
# 	targetFlag="--target crw-${JOB_BRANCH}-openj9-rhel-8-containers-candidate" # required for resolving openj9 artifacts 
# fi

# CRW-611 GraalVM CE and native-image version from https://github.com/graalvm/graalvm-ce-builds/releases/ (includes JDK 11)
# GRAALVM_VERSION="19.3.1"

# Gradle from https://services.gradle.org/distributions/
GRADLE_VERSION="6.1"

# maven 3.5 rpm bundles JDK8 dependencies, so install 3.6 from https://maven.apache.org/download.cgi to avoid extras
MAVEN_VERSION="3.6.3"

# update Dockerfile to record version we expect for MAVEN_VERSION and GRADLE_VERSION
sed Dockerfile \
	-e "s#GRADLE_VERSION=\"\([^\"]\+\)\"#GRADLE_VERSION=\"${GRADLE_VERSION}\"#" \
	-e "s#MAVEN_VERSION=\"\([^\"]\+\)\"#MAVEN_VERSION=\"${MAVEN_VERSION}\"#" \
	> Dockerfile.2

# pull maven (if not present, or forced, or new version in dockerfile)
if [[ ! -f apache-maven-${MAVEN_VERSION}-bin.tar.gz ]] || [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${forcePull} -eq 1 ]]; then
	mv -f Dockerfile.2 Dockerfile
	curl -sSL -O https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip
	curl -sSL -O http://mirror.csclub.uwaterloo.ca/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz
	log "[INFO] Upload new sources: gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz"
	rhpkg new-sources gradle-${GRADLE_VERSION}-bin.zip apache-maven-${MAVEN_VERSION}-bin.tar.gz
	log "[INFO] Commit new sources"
	COMMIT_MSG="${COMMIT_MSG}Gradle ${GRADLE_VERSION}, Maven ${MAVEN_VERSION}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push
  fi
	if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${targetFlag} ${scratchFlag}"
		tmpfile=${mktemp) && rhpkg container-build ${targetFlag} ${scratchFlag} --nowait | tee 2>&1 $tmpfile
		taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
		ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	if [[ ${forceBuild} -eq 1 ]]; then
	echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${targetFlag} ${scratchFlag}"
	tmpfile=${mktemp) && rhpkg container-build ${targetFlag} ${scratchFlag} --nowait | tee 2>&1 $tmpfile
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
