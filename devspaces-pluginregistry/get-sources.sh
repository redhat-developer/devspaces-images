#!/bin/bash -xe
# script to trigger rhpkg - after building sources: TODO switch to cachito
#
verbose=0
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
PULL_ASSETS=0

tmpContainer=pluginregistry:tmp

while [[ "$#" -gt 0 ]]; do
	case $1 in
		'-p'|'--pull-assets') PULL_ASSETS=1; shift 0;;
		'-a'|'--publish-assets') exit 0; shift 0;;
		'-d'|'--delete-assets') exit 0; shift 0;;
		'-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
		'-f'|'--force-build') forceBuild=1; shift 0;;
		'-s'|'--scratch') scratchFlag="--scratch"; shift 0;;
		'-v') CSV_VERSION="$2"; shift 1;;
	esac
	shift 1
done

function log()
{
	if [[ ${verbose} -gt 0 ]]; then
		echo "$1"
	fi
}

function buildTarball() {
	local TARBALLS="$1"
	local BUILDER_IMAGE="$2"
	local DOCKERFILE="$3"
	local DOCKERCMD="$4"
	for TARBALL in $TARBALLS; do
		# remove the file without its path
		rm -f ./${TARBALL##*/} || true
	done
	# delete any existing images / references
	${BUILDER} rm -f "${BUILDER_IMAGE}_tmp" || true
	${BUILDER} rmi -f "${BUILDER_IMAGE}:tmp" || true
	# build
	${BUILDER} build --progress=plain -f "${DOCKERFILE}" \
		-t "${BUILDER_IMAGE}:tmp" . $DOCKERCMD || exit 3
	# rename
	${BUILDER} create --name "${BUILDER_IMAGE}_tmp" "${BUILDER_IMAGE}:tmp"
	for TARBALL in $TARBALLS; do
		# extract
		${BUILDER} cp "${BUILDER_IMAGE}_tmp":/${TARBALL} . || exit 4
		# add to TARGZs list
		TARGZs="${TARGZs} ${TARBALL##*/}"
	done
	# cleanup
	${BUILDER} rm -f "${BUILDER_IMAGE}_tmp" || true
	${BUILDER} rmi -f "${BUILDER_IMAGE}:tmp" || true
}

if [[ ${PULL_ASSETS} -eq 1 ]]; then 
	BUILDER=$(command -v podman || true)
	if [[ ! -x $BUILDER ]]; then
		# echo "[WARNING] podman is not installed, trying with docker"
		BUILDER=$(command -v docker || true)
		if [[ ! -x $BUILDER ]]; then
			echo "[ERROR] must install docker or podman. Abort!"; exit 1
		fi
	fi

	#
	# create/update sources tarballs (needed for offline Brew builds)
	# TODO replace this with cachito
	#

	# transform Brew friendly bootstrap.Dockerfile so we can use it in Jenkins where base images need full registry path
	sed bootstrap.Dockerfile -i --regexp-extended \
		`# replace org/container:tag with reg-proxy/rh-osbs/org-container:tag` \
		-e "s#^FROM ([^/:]+)/([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\1-\2:\3#" \
		`# replace ubi8-minimal:tag with reg-proxy/rh-osbs/ubi-minimal:tag` \
		-e "s#^FROM ([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\1:\2#"
	echo "======= BOOTSTRAP DOCKERFILE =======>"
	cat bootstrap.Dockerfile
	echo "<======= BOOTSTRAP DOCKERFILE ======="
	echo "======= START BOOTSTRAP BUILD =======>"
	${BUILDER} build -t ${tmpContainer} . --no-cache -f bootstrap.Dockerfile \
		--target builder --build-arg BOOTSTRAP=true
	echo "<======= END BOOTSTRAP BUILD ======="

	# update tarballs - step 2 - check old sources' tarballs
	git rm -f *.tar.gz *.tgz 2>/dev/null || rm -f *.tar.gz *.tgz || true
	rhpkg sources || true

	# update tarballs - step 3 - create new tarballs
	# NOTE: CRW-1610 used to be in /root/.local but now can be found in /opt/app-root/src/.local
	tmpDir="$(mktemp -d)"
	${BUILDER} run --rm -v \
		${tmpDir}/:/tmp/root-local/ ${tmpContainer} /bin/bash \
		-c 'cd /opt/app-root/src/.local/ && cp -r bin/ lib/ /tmp/root-local/'
	MYUID=$(id -u); MYGID=$(id -g); sudo chown -R $MYUID:$MYGID $tmpDir
	# check diff
	if [[ -f root-local.tgz ]]; then 
		BEFORE_DIR="$(mktemp -d)"
		tar xzf root-local.tgz -C ${BEFORE_DIR}
		TAR_DIFF=$(diff --suppress-common-lines -u -r ${BEFORE_DIR} ${tmpDir} -x "*.pyc" -x "installed-files.txt") || true
		sudo rm -fr ${BEFORE_DIR}
		# add to TARGZs list
		TARGZs="${TARGZs} root-local.tgz"
	else
		TAR_DIFF="No such file root-local.tgz -- could not fetch from 'rhpkg sources'"
		TARGZs="${TARGZs} root-local.tgz"
	fi
	if [[ ${TAR_DIFF} ]]; then
		echo "DIFF START *****"
		echo "${TAR_DIFF}"
		echo "***** END DIFF"
		pushd ${tmpDir} >/dev/null && tar czf root-local.tgz lib/ bin/ && popd >/dev/null && mv -f ${tmpDir}/root-local.tgz .
	fi
	sudo rm -fr ${tmpDir}

	# we always need a fresh resources.tgz to guarantee proper timestamps and latest vsix files
	rm -f ./resources.tgz || true
	${BUILDER} create --name pluginregistryBuilder ${tmpContainer}
	${BUILDER} cp pluginregistryBuilder:/tmp/resources/resources.tgz .
	${BUILDER} rm -f pluginregistryBuilder
	${BUILDER} rmi ${tmpContainer}
	# add to TARGZs list
	TARGZs="${TARGZs} resources.tgz"

	SCRIPT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
    if [[ $SCRIPT_BRANCH != "devspaces-3."*"-rhel-8" ]]; then
        SCRIPT_BRANCH="devspaces-3-rhel-8"
    fi
    
    # save current branch name to the temporary file, it will be used in the openvsx-builder.Dockerfile build
    echo "$SCRIPT_BRANCH" > current_branch
    
    # load job-config.json file
    base_dir=$(cd "$(dirname "$0")"; pwd)
    jobconfigjson="${base_dir}/job-config.json"
    echo "Load ${jobconfigjson}"
    # get the tag of che-openvsx from job-config.json
    REGISTRY_VERSION=$(jq -r '.Version' "${jobconfigjson}");
    echo "REGISTRY_VERSION ${REGISTRY_VERSION}"
    CHE_OPENVSX_TAG=$(jq -r --arg REGISTRY_VERSION "${REGISTRY_VERSION}" '.Other["CHE_OPENVSX_TAG"][$REGISTRY_VERSION]' "${jobconfigjson}");
    echo "CHE_OPENVSX_TAG ${CHE_OPENVSX_TAG}"

    # build 2 new tarballs
    buildTarball "/openvsx-server.tar.gz" "che-openvsx" "build/dockerfiles/openvsx-builder.Dockerfile" "--target builder --build-arg CHE_OPENVSX_TAG=${CHE_OPENVSX_TAG}"
	buildTarball "opt/app-root/src/ovsx.tar.gz" "che-ovsx" "build/dockerfiles/ovsx-installer.Dockerfile" "--target builder"
	# remove temporary file
	rm current_branch 
fi

# update tarballs - step 4 - commit changes if diff different
if [[ ${TAR_DIFF} ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
	log "[INFO] Commit new sources"
	rhpkg new-sources ${TARGZs}
	COMMIT_MSG="ci: ${TARGZs}"
	maxfilesize=$(du -b ${TARGZs} | sed -r -e "s#\t.+##" | sort -Vr | head -1)
	# include any new files...
	git add . -A -f
	# but DON'T include lookaside files in git
	git rm -fr ${TARGZs} 2>/dev/null || true 
	# CRW-1621 a gz resource is larger than 10485760b, so use MaxFileSize to force dist-git to shut up and take my sources!
	if [[ $(git commit -s -m "${COMMIT_MSG}
		- MaxFileSize: $maxfilesize
" sources Dockerfile .gitignore . || true) == *"nothing to commit, working tree clean"* ]]; then
		log "[INFO] No new sources, so nothing to build."
	elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] Push change:"
		git pull; git push; git status -s || true
	fi

	if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
		log "[INFO] #1 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		gitbranch="$(git rev-parse --abbrev-ref HEAD)"
		if [[ $scratchFlag == "--scratch" ]]; then gitbranch="devspaces-3-rhel-8"; fi
		target=${gitbranch}-containers-candidate
		repo="$(git remote -v | grep origin | head -1 | sed -r -e "s#.+/containers/(.+) \(fetch.+#\1#")"
		sha="$(git rev-parse HEAD)"
		tmpfile=$(mktemp) && brew container-build ${target} git+https://pkgs.devel.redhat.com/git/containers/${repo}#${sha} --git-branch ${gitbranch} --nowait 2>/dev/null | tee 2>&1 "${tmpfile}"
		taskID=$(cat "${tmpfile}" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "${tmpfile}"
		ERRORS="$(grep "image build failed" "${tmpfile}")" && rm -f "${tmpfile}"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	if [[ ${forceBuild} -eq 1 ]]; then
		log "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
		git status || true
		gitbranch="$(git rev-parse --abbrev-ref HEAD)"
		if [[ $scratchFlag == "--scratch" ]]; then gitbranch="devspaces-3-rhel-8"; fi
		target=${gitbranch}-containers-candidate
		repo="$(git remote -v | grep origin | head -1 | sed -r -e "s#.+/containers/(.+) \(fetch.+#\1#")"
		sha="$(git rev-parse HEAD)"
		tmpfile=$(mktemp) && brew container-build ${target} git+https://pkgs.devel.redhat.com/git/containers/${repo}#${sha} --git-branch ${gitbranch} --nowait 2>/dev/null | tee 2>&1 "${tmpfile}"
		taskID=$(cat "${tmpfile}" | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 "${tmpfile}"
		ERRORS="$(grep "image build failed" "${tmpfile}")" && rm -f "${tmpfile}"
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	else
		log "[INFO] No new sources, so nothing to build."
	fi
fi
