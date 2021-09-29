#!/bin/bash -xe
# script to get tarball(s) from Jenkins, plus additional dependencies as needed
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
pullAssets=0
generateDockerfileLABELs=1
while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
	'-f'|'--force-build') forceBuild=1; shift 0;;
	'-p'|'--pull-assets') pullAssets=1; shift 0;;
	'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
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

UPSTREAM_JOB_NAME="crw-deprecated_${JOB_BRANCH}" # eg., 2.4

jenkinsURL=""
checkJenkinsURL() {
	checkURL="$1"
	if [[ ! $(curl -sSLI ${checkURL} 2>&1 | grep -E "404|Not Found|Failed to connect|No route to host|Could not resolve host|Connection refused") ]]; then
		jenkinsURL="$checkURL"
	else
		jenkinsURL=""
	fi
}
# try local env var first
if [[ ${JENKINS_URL} ]]; then 
	checkJenkinsURL "${JENKINS_URL}job/CRW_CI/job/${UPSTREAM_JOB_NAME}"
fi
# new jenkins & path
if [[ ! $jenkinsURL ]]; then
	checkJenkinsURL "https://main-jenkins-csb-crwqe.apps.ocp4.prod.psi.redhat.com/job/CRW_CI/job/${UPSTREAM_JOB_NAME}"
fi
# old jenkins & path
if [[ ! $jenkinsURL ]]; then
	checkJenkinsURL "https://codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com/job/${UPSTREAM_JOB_NAME}"
fi
if [[ ! $jenkinsURL ]]; then
	echo "[ERROR] Cannot resolve artifact(s) for this build. Must abort!"
	exit 1
fi
theTarGzs="
lastSuccessfulBuild/artifact/codeready-workspaces-deprecated/node10/target/codeready-workspaces-stacks-language-servers-dependencies-node10-x86_64.tar.gz
lastSuccessfulBuild/artifact/codeready-workspaces-deprecated/python/target/codeready-workspaces-stacks-language-servers-dependencies-python-x86_64.tar.gz
"
lastSuccessfulURL="${jenkinsURL}/lastSuccessfulBuild/api/xml?xpath=/workflowRun/" # id
# maven - install 3.6 from https://maven.apache.org/download.cgi
MAVEN_VERSION="3.6.3"

LOMBOK_VERSION="1.18.18"

LABELs=""
function addLabel () {
	addLabeln "${1}" "${2}" "${3}"
	echo ""
}
function addLabeln () {
	LABEL_VAR=$1
	if [[ "${2}" ]]; then LABEL_VAL=$2; else LABEL_VAL="${!LABEL_VAR}"; fi
	if [[ "${3}" ]]; then PREFIX=$3; else PREFIX="  << "; fi
	if [[ ${generateDockerfileLABELs} -eq 1 ]]; then 
		LABELs="${LABELs} ${LABEL_VAR}=\"${LABEL_VAL}\""
	fi
	echo -n "${PREFIX}${LABEL_VAL}"
}

function parseCommitLog () 
{
	# Update from Jenkins ::
	# crw_master ::
	# Build #246 (2019-02-26 04:23:36 EST) ::
	# che-ls-jdt @ 288b75765175d368480a688c8f3a77ce4758c72d (0.0.3) ::
	# che @ f34f4c6c82de35081351e0b0686b1ae6589735d4 (6.19.0-SNAPSHOT) ::
	# codeready-workspaces @ 184e24bee5bd923b733fa8c9f4b055a9caad40d2 (1.1.0.GA) ::
	# codeready-workspaces-deprecated @ 620a53c5b0a1bbc02ba68e96be94ec3b932c9bee ::
	# codeready-workspaces-assembly-main.tar.gz
	# codeready-workspaces-stacks-language-servers-dependencies-bayesian.tar.gz
	# codeready-workspaces-stacks-language-servers-dependencies-node.tar.gz
	tarballs=""
	OTHER=""
	JOB_NAME=""
	GHE="https://github.com/eclipse/"
	GHR="https://github.com/redhat-developer/"
	while [[ "$#" -gt 0 ]]; do
	  case $1 in
		'crw_master'|'crw_stable-branch'|'crw-deprecated_'*) JOB_NAME="$1"; shift 2;;
		'Build'*) BUILD_NUMBER="$2"; BUILD_NUMBER=${BUILD_NUMBER#\#}; shift 6;; # trim # from the number, ignore timestamp
		'che-dev'|'che-parent'|'che-lib'|'che-ls-jdt'|'che') 
			sha="$3"; addLabeln "git.commit.eclipse__${1}" "${GHE}${1}/commit/${sha:0:7}"; addLabel "pom.version.eclipse__${1}" "${4:1:-1}" " "; shift 5;;
		'codeready-workspaces')
			sha="$3"; addLabeln "git.commit.redhat-developer__${1}" "${GHR}${1}/commit/${sha:0:7}"; addLabel "pom.version.redhat-developer__${1}" "${4:1:-1}" " "; shift 5;;
		'codeready-workspaces-deprecated')
			sha="$3"; addLabeln "git.commit.redhat-developer__${1}" "${GHR}${1}/commit/${sha:0:7}"; shift 4;;
		*'tar.gz') tarballs="${tarballs} $1"; shift 1;;
		*) OTHER="${OTHER} $1"; shift 1;; 
	  esac
	done
	if [[ $JOB_NAME ]]; then
		jenkinsServer="${jenkinsURL%/job/*}"
		addLabel "jenkins.build.url" "${jenkinsServer}/view/CRW_CI/view/Pipelines/job/${JOB_NAME}/${BUILD_NUMBER}/"
		for t in $tarballs; do
			addLabel "jenkins.artifact.url" "${jenkinsServer}/view/CRW_CI/view/Pipelines/job/${JOB_NAME}/${BUILD_NUMBER}/artifact/**/${t}" "	 ++ "
		done
	else
		addLabel "jenkins.tarball.url" "${jenkinsServer}/view/CRW_CI/view/Pipelines #${BUILD_NUMBER} /${tarballs}"
	fi
}

function insertLabels () {
	DOCKERFILE=$1
	# trim off the footer of the file
	mv ${DOCKERFILE} ${DOCKERFILE}.bak
	sed '/.*insert generated LABELs below this line.*/q' ${DOCKERFILE}.bak > ${DOCKERFILE}
	# insert marker
	if [[ ! $(cat ${DOCKERFILE}.bak | grep "insert generated LABELs below this line") ]]; then 
		echo "" >> ${DOCKERFILE}
		echo "" >> ${DOCKERFILE}
		echo "# insert generated LABELs below this line" >> ${DOCKERFILE}
	fi
	# add new labels
	echo "LABEL \\" >> ${DOCKERFILE}
	for l in $LABELs; do
		echo "	  ${l} \\" >> ${DOCKERFILE}
	done
	echo "	  jenkins.build.number=\"${BUILD_NUMBER}\"" >> ${DOCKERFILE}
	rm -f ${DOCKERFILE}.bak
}

function getFingerprints ()
{
	outputFile=$1
	latestFingerprint="$(curl -L ${jenkinsURL}/lastSuccessfulBuild/fingerprints/ 2>&1 | grep ${outputFile} | sed -e "s#.\+/fingerprint/\([0-9a-f]\+\)/\".\+#\1#")"
	currentFingerprint="$(cat sources | grep ${outputFile} | sed -e "s#\([0-9a-f]\+\) .\+#\1#")"
}

# get the public URL for the tarball(s)
outputFiles=""

#### override any existing tarballs with newer ones from Jenkins build
for theTarGz in ${theTarGzs}; do
	outputFile=${theTarGz##*/}
	log "[INFO] Download ${jenkinsURL}/${theTarGz}:"
	rm -f ${outputFile}
	getFingerprints ${outputFile}
	if [[ ! ${latestFingerprint} ]]; then 
		echo "[WARNING] Cannot resolve artifact fingerprints for ${outputFile}"
	fi
	
	if [[ "${latestFingerprint}" != "${currentFingerprint}" ]] || [[ ! -f ${outputFile} ]] || [[ ${pullAssets} -eq 1 ]]; then 
		curl -L -o ${outputFile} ${jenkinsURL}/${theTarGz}
		outputFiles="${outputFiles} ${outputFile}"
	fi
done

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
outputFiles="apache-maven-${MAVEN_VERSION}-bin.tar.gz lombok-${LOMBOK_VERSION}.jar ${outputFiles}"

if [[ ${outputFiles} ]]; then
	log "[INFO] Upload new sources:${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from:${outputFiles}"
	field=id; ID=$(curl -L -s -S ${lastSuccessfulURL}${field} | sed -e "s#<${field}>\(.\+\)</${field}>#\1#" -e "s#&lt;br/&gt; #\n#g" -e "s#\&lt;a.\+/a\&gt;##g")
	if [[ $(echo $ID | grep -E "404 Not Found|ERROR 404|Application is not available") ]]; then 
		echo $ID
		echo "[ERROR] Problem loading ID from ${lastSuccessfulURL}${field} :: NOT FOUND!"
		exit 1;
	fi
	COMMIT_MSG="Update from Jenkins :: Maven ${MAVEN_VERSION} + ${UPSTREAM_JOB_NAME} :: ${ID}
::${outputFiles}"
	parseCommitLog ${COMMIT_MSG}
	insertLabels Dockerfile
	if [[ $(git commit -s -m "ci: [get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]] ;then 
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
