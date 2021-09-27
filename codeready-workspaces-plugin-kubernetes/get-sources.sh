#!/bin/bash -xe
# script to get tarball(s) from Jenkins
scratchFlag=""
JOB_BRANCH=""
doRhpkgContainerBuild=1
forceBuild=0
pullAssets=0
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

# if not set, compute from current branch
if [[ ! ${JOB_BRANCH} ]]; then 
	JOB_BRANCH=$(git rev-parse --abbrev-ref HEAD); JOB_BRANCH=${JOB_BRANCH//crw-}; JOB_BRANCH=${JOB_BRANCH%%-rhel*}
	if [[ ${JOB_BRANCH} == "2" ]]; then JOB_BRANCH="2.x"; fi
fi

UPSTREAM_JOB_NAME="crw-deprecated_${JOB_BRANCH}" # eg., 2.6

# see https://github.com/redhat-developer/codeready-workspaces-deprecated/blob/crw-2-rhel-8/kamel/build.sh#L16 or https://github.com/apache/camel-k/releases
KAMEL_BUILDSH="https://github.com/redhat-developer/codeready-workspaces-deprecated/raw/$(git rev-parse --abbrev-ref HEAD)/kamel/build.sh"
KAMEL_VERSION="$(curl -sSLo- ${KAMEL_BUILDSH} | grep "export KAMEL_VERSION" | sed -r -e 's#.+KAMEL_VERSION="(.+)"#\1#')"
echo "Using KAMEL_VERSION = ${KAMEL_VERSION} from ${KAMEL_BUILDSH}"

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
lastSuccessfulURL="${jenkinsURL}/lastSuccessfulBuild/api/xml?xpath=/workflowRun/" # id

jenkinsURL=${jenkinsURL}/lastSuccessfulBuild/artifact/codeready-workspaces-deprecated/kamel/target

# patch Dockerfile to record versions we expect
sed Dockerfile \
		-e "s#KAMEL_VERSION=\"\([^\"]\+\)\"#KAMEL_VERSION=\"${KAMEL_VERSION}\"#" \
		> Dockerfile.2

if [[ $(diff -U 0 --suppress-common-lines -b Dockerfile Dockerfile.2) ]] || [[ ${pullAssets} -eq 1 ]]; then
	rm -fr asset-*
	mv -f Dockerfile.2 Dockerfile
	# x86
	curl -sSLo - ${jenkinsURL}/kamel-${KAMEL_VERSION}-x86_64.tar.gz | tar -xz && mv kamel asset-x86_64-kamel

	# s390x
	curl -sSLo - ${jenkinsURL}/kamel-${KAMEL_VERSION}-s390x.tar.gz | tar -xz && mv kamel asset-s390x-kamel

	# ppc64le
	curl -sSLo - ${jenkinsURL}/kamel-${KAMEL_VERSION}-ppc64le.tar.gz | tar -xz && mv kamel asset-ppc64le-kamel
	
	for d in asset-*; do echo "[INFO] Pack ${d}.tar.gz"; mv ${d} ${d##*-}; tar -cvzf ${d}.tar.gz ${d##*-}; mv ${d##*-} ${d}-unpacked; done
	rm -fr asset-*-unpacked
fi

outputFiles="$(ls asset-*.tar.gz || true)"
if [[ ${outputFiles} ]]; then
	log "[INFO] Upload new sources: ${outputFiles}"
	rhpkg new-sources ${outputFiles}
	log "[INFO] Commit new sources from: ${outputFiles}"
	field=id; ID=$(curl -L -s -S ${lastSuccessfulURL}${field} | sed -e "s#<${field}>\(.\+\)</${field}>#\1#" -e "s#&lt;br/&gt; #\n#g" -e "s#\&lt;a.\+/a\&gt;##g")
	if [[ $(echo $ID | grep -E "404 Not Found|ERROR 404|Application is not available") ]]; then 
		echo $ID
		echo "[ERROR] Problem loading ID from ${lastSuccessfulURL}${field} :: NOT FOUND!"
		exit 1;
	fi
	COMMIT_MSG="Update from Jenkins :: kamel ${KAMEL_VERSION} from ${UPSTREAM_JOB_NAME} :: ${ID}
:: ${outputFiles}"
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
