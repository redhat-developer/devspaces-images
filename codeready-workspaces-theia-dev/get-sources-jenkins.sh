#!/bin/bash -xe
# script to get tarball(s) from Jenkins
field=description
verbose=1
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
noPull=0
generateDockerfileLABELs=1

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
    '-f'|'--force-build') forceBuild=1; shift 0;;
    '-p'|'--force-pull') forcePull=1; noPull=0; shift 0;;
    '-np'|'--no-pull') forcePull=1; noPull=1; shift 0;;
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

# NOTE when adding/removing files, make sure to add use case to checkOutput function below
UPSTREAM_JOB_NAME="crw-theia-sources_${JOB_BRANCH}"

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
lastSuccessfulURL="${jenkinsURL}/lastSuccessfulBuild/api/xml?xpath=//" # id or description

# make sure this is the correct path for the job's artifacts
assetPath="lastSuccessfulBuild/artifact/crw-theia/dockerfiles/theia-dev"

function checkOutput()
{
	set +x
	WHAT="$(file ${outputFile})"
	if [[ ${outputFile} == *"gz" ]] && [[ "${WHAT}" == *"gzip compressed"* ]]; then
		outputFiles="${outputFiles} ${outputFile}"
	elif [[ "${WHAT}" == *"Zip archive"* ]]; then
		if [[ ${outputFile} == *".zip" ]] || [[ ${outputFile} == *".theia" ]]; then
			outputFiles="${outputFiles} ${outputFile}"
		fi
	elif [[ ${outputFile} == *".lock" ]] && [[ "${WHAT}" == *"text"* ]]; then
		outputFiles="${outputFiles} ${outputFile}"
	elif [[ ${outputFile} == *".txt" ]] && [[ "${WHAT}" == *"text"* ]]; then
		outputFiles="${outputFiles} ${outputFile}"
	else
		if [[ "${WHAT}" == *"HTML"* ]]; then cat ${outputFile}; fi
		echo "[ERROR] Could not determine file type of downloaded asset file or file not found"
		echo "[ERROR] Build must exit!"
		exit 1
	fi
	set -x
}

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
	if [[ "${3}" ]]; then PREFIX=$3; else PREFIX="  << "; fi
	if [[ ${generateDockerfileLABELs} -eq 1 ]]; then 
		LABELs="${LABELs} ${LABEL_VAR}=\"${LABEL_VAL}\""
	fi
	echo -n "${PREFIX}${LABEL_VAL}"
}

function parseCommitLog () 
{
	# Update from Jenkins ::
	# crw_2.4 ::
	# Build #246 (2019-02-26 04:23:36 EST) ::
	# che-ls-jdt @ 288b75765175d368480a688c8f3a77ce4758c72d (0.0.3) ::
	# che @ f34f4c6c82de35081351e0b0686b1ae6589735d4 (6.19.0-SNAPSHOT) ::
	# codeready-workspaces @ 184e24bee5bd923b733fa8c9f4b055a9caad40d2 (1.1.0.GA) ::
	# codeready-workspaces-deprecated @ 620a53c5b0a1bbc02ba68e96be94ec3b932c9bee (1.0.0.GA-SNAPSHOT) ::
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
		'crw_2.4'|'crw_stable-branch'|'crw-deprecated_'*) JOB_NAME="$1"; shift 2;;
		'Build'*) BUILD_NUMBER="$2"; BUILD_NUMBER=${BUILD_NUMBER#\#}; shift 6;; # trim # from the number, ignore timestamp
		'che-dev'|'che-parent'|'che-lib'|'che-ls-jdt'|'che') 
			sha="$3"; addLabeln "git.commit.eclipse__${1}" "${GHE}${1}/commit/${sha:0:7}"; addLabel "pom.version.eclipse__${1}" "${4:1:-1}" " "; shift 5;;
		'codeready-workspaces'|'codeready-workspaces-deprecated') 
			sha="$3"; addLabeln "git.commit.redhat-developer__${1}" "${GHR}${1}/commit/${sha:0:7}"; addLabel "pom.version.redhat-developer__${1}" "${4:1:-1}" " "; shift 5;;
		*'tar.gz') tarballs="${tarballs} $1"; shift 1;;
		*'zip') tarballs="${tarballs} ${1/\/\*zip\*\/*/.zip}"; shift 1;; # instead of .../branding/*zip*/branding.zip, collect tarball = .../branding.zip
		*) OTHER="${OTHER} $1"; shift 1;; 
	  esac
	done
	# echo "Found these: [ $tarballs ]"

	if [[ $JOB_NAME ]]; then
        jenkinsServer="${jenkinsURL%/job/*}"
		addLabel "jenkins.build.url" "${jenkinsServer}/job/${JOB_NAME}/${BUILD_NUMBER}/"
		for t in $tarballs; do
            addLabel "jenkins.artifact.url" "${jenkinsServer}/job/${JOB_NAME}/${BUILD_NUMBER}/artifact/**/${t}" "     ++ "
		done
	else
		addLabel "jenkins.tarball.url" "${jenkinsServer}/job/${JOB_NAME} #${BUILD_NUMBER} /${tarballs}"
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
        echo "      ${l} \\" >> ${DOCKERFILE}
	done
    echo "      jenkins.build.number=\"${BUILD_NUMBER}\"" >> ${DOCKERFILE}
	rm -f ${DOCKERFILE}.bak
}

function getFingerprints ()
{
	outputFile=$1
	latestFingerprint="$(curl -L ${jenkinsURL}/lastSuccessfulBuild/fingerprints/ 2>&1 | grep ${outputFile} | sed -e "s#.\+/fingerprint/\([0-9a-f]\+\)/\".\+#\1#")"
	currentFingerprint="$(cat sources | grep ${outputFile} | sed -e "s#\([0-9a-f]\+\) .\+#\1#")"
}

set +x
# get list of the files we need from Jenkins, eg.,
# JENKINS_URL/path/to/job_name/lastSuccessfulBuild/artifact/crw-theia/dockerfiles/theia/asset-list.txt
theTarGzs=""
arches=$(cat container.yaml | yq -r .platforms.only[])
for a in $arches ; do
  assetList=asset-list-${a}.txt
  log "[INFO] Download asset list from ${jenkinsURL}/${assetPath}/${assetList}:"
  curl -sSLO ${jenkinsURL}/${assetPath}/${assetList}
done
for d in $(cat asset-list-*.txt | sort | uniq); do
	if [[ "${d}" == "asset-"* ]]; then 
		theTarGzs="${theTarGzs} ${assetPath}/${d}"
	fi
done
if [[ ! ${theTarGzs} ]]; then 
	echo "[ERROR] No asset files found from ${jenkinsURL}/${assetPath}/${assetList} ! Check your ${UPSTREAM_JOB_NAME} is a valid job with valid artifacts!"
	exit 1;
fi
rm -f asset-list-*.txt
set -x

# get the public URL for the tarball(s)
outputFiles=""

for theTarGz in ${theTarGzs}; do
	outputFile=${theTarGz##*/}
	if [[ ${noPull} -eq 0 ]]; then
		log "[INFO] Download ${jenkinsURL}/${theTarGz}:"
		rm -f ${outputFile}
		getFingerprints ${outputFile}
	else
		echo "[INFO] Skip download of ${jenkinsURL}/${theTarGz} as ${outputFile}"
	fi

	if [[ "${latestFingerprint}" != "${currentFingerprint}" ]] || [[ ! -f ${outputFile} ]] || [[ ${forcePull} -eq 1 ]]; then
		if [[ ${noPull} -eq 0 ]]; then
			curl -sSL -o ${outputFile} ${jenkinsURL}/${theTarGz}
		fi
		checkOutput
	fi
done

if [[ ${outputFiles} ]]; then
	log "[INFO] Upload new sources:${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from:${outputFiles}"
	ID=$(curl -L -s -S ${lastSuccessfulURL}${field} | \
		sed -e "s#<${field}>\(.\+\)</${field}>#\1#" -e "s#&lt;br/&gt; #\n#g" -e "s#\&lt;a.\+/a\&gt;##g")
	if [[ $(echo $ID | grep -E "404 Not Found|ERROR 404|Application is not available") ]]; then 
		echo $ID
		echo "[ERROR] Problem loading ID from $lastSuccessfulURL :: NOT FOUND!"
		exit 1;
	fi
	COMMIT_MSG="Update from Jenkins :: ${UPSTREAM_JOB_NAME} :: ${ID}
::${outputFiles}"
	parseCommitLog ${COMMIT_MSG}
	insertLabels Dockerfile
	maxfilesize=$(du -b asset-* | sed -r -e "s#\t.+##" | sort -Vr | head -1)
	# include any new files...
	git add . -A -f
	# but DON'T include asset-* files in git
	git rm -fr asset-* 2>/dev/null || true 
	# CRW-1621 a gz resource is larger than 10485760b, so use MaxFileSize to force dist-git to shut up and take my sources!
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}
    - MaxFileSize: $maxfilesize
" sources Dockerfile .gitignore . || true) == *"nothing to commit, working tree clean"* ]]; then
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		git status -s -b --ignored
		log "[INFO] Push change:"
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
		log "[INFO] No new sources, so nothing to build."
	fi
fi
