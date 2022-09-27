#!/bin/bash -xe

verbose=0
scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
# NOTE: --pull-assets (-p) flag uses opposite behaviour to some other get-sources.sh scripts;
# here we want to collect assets during sync-to-downsteam (using get-sources.sh -n -p)
# so that rhpkg build is simply a brew wrapper (using get-sources.sh -f)
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
	${BUILDER} build -t ${tmpContainer} . --progress=plain --no-cache -f bootstrap.Dockerfile \
		--target builder --build-arg BOOTSTRAP=true
	echo "<======= END BOOTSTRAP BUILD ======="
	# update tarballs - step 2 - check old sources' tarballs
	TARGZs="root-local.tgz resources.tgz openvsx-server.tar.gz nodejs.tar.gz postgresql13.tar.gz"
	git rm -f $TARGZs 2>/dev/null || rm -f $TARGZs || true
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
	else
		TAR_DIFF="No such file root-local.tgz -- could not fetch from 'rhpkg sources'"
	fi
	if [[ ${TAR_DIFF} ]]; then
		echo "DIFF START *****"
		echo "${TAR_DIFF}"
		echo "***** END DIFF"
		pushd ${tmpDir} >/dev/null && tar czf root-local.tgz lib/ bin/ && popd >/dev/null && mv -f ${tmpDir}/root-local.tgz .
	fi
	sudo rm -fr ${tmpDir}

	# we always need a fresh resources.tgz to guarantee proper timestamps and latest vsix files
	rm -f ./resources.tgz
	${BUILDER} create --name pluginregistryBuilder ${tmpContainer}
	${BUILDER} cp pluginregistryBuilder:/tmp/resources/resources.tgz .
	${BUILDER} rm -f pluginregistryBuilder
	${BUILDER} rmi ${tmpContainer}

	rm -f ./openvsx-server.tar.gz
	OPENVSX_BUILDER_IMAGE=che-openvsx:latest
	${BUILDER} build --progress=plain -f build/dockerfiles/openvsx-builder.Dockerfile \
		-t "$OPENVSX_BUILDER_IMAGE" . --target builder
	${BUILDER} create --name openvsxBuilder ${OPENVSX_BUILDER_IMAGE}
	${BUILDER} cp openvsxBuilder:/openvsx-server.tar.gz .
	${BUILDER} rm -f openvsxBuilder
	${BUILDER} rmi ${OPENVSX_BUILDER_IMAGE}

	rm -f ./nodejs.tar.gz
	OVSX_BUILDER_IMAGE=che-ovsx:latest
	${BUILDER} build --progress=plain -f build/dockerfiles/ovsx-installer.Dockerfile \
		-t "$OVSX_BUILDER_IMAGE" .
	${BUILDER} create --name ovsxBuilder ${OVSX_BUILDER_IMAGE}
	${BUILDER} cp ovsxBuilder:ovsx/nodejs.tar.gz .
	${BUILDER} rm -f ovsxBuilder
	${BUILDER} rmi ${OVSX_BUILDER_IMAGE}

	rm -f ./postgresql13.tar.gz
	POSTGRESQL_BUILDER_IMAGE=postgresql13:latest
	${BUILDER} build --progress=plain -f build/dockerfiles/postgresql.Dockerfile \
		-t "$POSTGRESQL_BUILDER_IMAGE" . --target builder
	${BUILDER} create --name postgresqlBuilder ${POSTGRESQL_BUILDER_IMAGE}
	${BUILDER} cp postgresqlBuilder:/postgresql13.tar.gz .
	${BUILDER} rm -f postgresqlBuilder
	${BUILDER} rmi ${POSTGRESQL_BUILDER_IMAGE}
fi

# update tarballs - step 4 - commit changes if diff different
if [[ ${TAR_DIFF} ]] || [[ ${TAR_DIFF2} ]] || [[ ${PULL_ASSETS} -eq 1 ]]; then
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
		tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
		taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
		ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
		if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
	fi
else
	if [[ ${forceBuild} -eq 1 ]]; then
		log "[INFO] #2 Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
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

