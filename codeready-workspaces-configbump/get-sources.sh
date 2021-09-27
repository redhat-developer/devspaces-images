#!/bin/bash -xe
# script to get tarball(s) from Jenkins
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

# if not set, compute from current branch
if [[ ! ${JOB_BRANCH} ]]; then 
	JOB_BRANCH=$(git rev-parse --abbrev-ref HEAD); JOB_BRANCH=${JOB_BRANCH//crw-}; JOB_BRANCH=${JOB_BRANCH%%-rhel*}
	if [[ ${JOB_BRANCH} == "2" ]]; then JOB_BRANCH="2.x"; fi
fi
UPSTREAM_JOB_NAME="crw-configbump_${JOB_BRANCH}"

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
lastSuccessfulBuild/artifact/asset-configbump-x86_64.tar.gz
lastSuccessfulBuild/artifact/asset-configbump-s390x.tar.gz
lastSuccessfulBuild/artifact/asset-configbump-ppc64le.tar.gz
"
lastSuccessfulURL="${jenkinsURL}/lastSuccessfulBuild/api/xml?xpath=/workflowRun/" # id
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

LABELs=""
function addLabel () {
	addLabeln "${1}" "${2}" "${3}"
	echo ""
}
function addLabeln () {
	LABEL_VAR=$1
	if [[ "${2}" ]]; then LABEL_VAL=$2; else LABEL_VAL="${!LABEL_VAR}"; fi
	if [[ "${3}" ]]; then PREFIX=$3; else PREFIX="	<< "; fi
	if [[ ${generateDockerfileLABELs} -eq 1 ]]; then 
		LABELs="${LABELs} ${LABEL_VAR}=\"${LABEL_VAL}\""
	fi
	echo -n "${PREFIX}${LABEL_VAL}"
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
		curl -sSL --insecure -o ${outputFile} ${jenkinsURL}/${theTarGz}
		outputFiles="${outputFiles} ${outputFile}"
	fi
done

if [[ ${outputFiles} ]]; then
	log "[INFO] Upload new sources:${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from:${outputFiles}"
	field=id; ID=$(curl -sSL --insecure ${lastSuccessfulURL}${field} | sed -e "s#<${field}>\(.\+\)</${field}>#\1#" -e "s#&lt;br/&gt; #\n#g" -e "s#\&lt;a.\+/a\&gt;##g")
	if [[ $(echo $ID | grep -E "404 Not Found|ERROR 404|Application is not available") ]]; then 
		echo $ID
		echo "[ERROR] Problem loading ID from ${lastSuccessfulURL}${field} :: NOT FOUND!"
		exit 1;
	fi
	COMMIT_MSG="Update from Jenkins :: ${UPSTREAM_JOB_NAME} :: ${ID}
::${outputFiles}"
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
