#!/bin/bash -xe
# script to trigger rhpkg - no sources needed here

scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	  '-f'|'--force-build') forceBuild=1; shift 0;;
	  '-p'|'--force-pull') forcePull=1; shift 0;;
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

# CRW-611 GraalVM CE and native-image version from https://github.com/graalvm/graalvm-ce-builds/releases/ (includes JDK 11)
# GRAALVM_VERSION="19.3.1"

# Gradle from https://services.gradle.org/distributions/
GRADLE_VERSION="6.1"

# maven 3.5 rpm bundles JDK8 dependencies, so install 3.6 from https://maven.apache.org/download.cgi
MAVEN_VERSION="3.6.3"

# update Dockerfile to record versions we expect
# -e "s#GRAALVM_VERSION=\"\([^\"]\+\)\"#GRAALVM_VERSION=\"${GRAALVM_VERSION}\"#" \
sed Dockerfile \
    -e "s#GRADLE_VERSION=\"\([^\"]\+\)\"#GRADLE_VERSION=\"${GRADLE_VERSION}\"#" \
    -e "s#MAVEN_VERSION=\"\([^\"]\+\)\"#MAVEN_VERSION=\"${MAVEN_VERSION}\"#" \
    > Dockerfile.2

if [[ $(diff -U 0 --suppress-common-lines -b Dockerfile.2 Dockerfile) ]] || [[ ${forcePull} -eq 1 ]]; then
  mkdir -p apache-maven/
  mv -f Dockerfile.2 Dockerfile
  # curl -sSLo - https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${GRAALVM_VERSION}/graalvm-ce-java11-linux-amd64-${GRAALVM_VERSION}.tar.gz | \
  #   tar -xz --strip=1 -C graalvm/

  # curl -sSL https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${GRAALVM_VERSION}/native-image-installable-svm-java11-linux-amd64-${GRAALVM_VERSION}.jar \
  #   -o native-image.jar && unzip native-image.jar -d graalvm/ && rm -f native-image.jar

  curl -sSL https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip \
    -o gradle.zip && unzip gradle.zip && rm -f gradle.zip && mv gradle-${GRADLE_VERSION} gradle

  curl -sSL http://mirror.csclub.uwaterloo.ca/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz | \
    tar -xz --strip=1 -C apache-maven/
    
  tar czf gradle.tgz gradle/
  tar czf maven.tgz apache-maven/
  log "[INFO] Upload new sources: gradle.tgz maven.tgz"
  rhpkg new-sources gradle.tgz maven.tgz
  log "[INFO] Commit new sources"
  # COMMIT_MSG="graalvm CE JDK11 + native-image ${GRAALVM_VERSION}, "
  COMMIT_MSG="${COMMIT_MSG}Gradle ${GRADLE_VERSION}, Maven ${MAVEN_VERSION}"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile) == *"nothing to commit, working tree clean"* ]]; then 
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push
  fi
  if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=`mktemp` && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(egrep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  fi
else
	if [[ ${forceBuild} -eq 1 ]]; then
    echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=`mktemp` && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(egrep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	else
	  log "[INFO] No new sources, so nothing to build."
  fi
fi

# cleanup
rm -fr Dockerfile.2 gradle/ apache-maven/
