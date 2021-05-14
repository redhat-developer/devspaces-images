#!/bin/bash -xe
# script to trigger rhpkg after updating vendor folder
#
verbose=1
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
function logn()
{
	if [[ ${verbose} -gt 0 ]]; then
	echo -n "$1"
	fi
}

# step one - build the builder image
BUILDER=$(command -v podman || true)
if [[ ! -x $BUILDER ]]; then
	echo "[WARNING] podman is not installed, trying with docker"
	BUILDER=$(command -v docker || true)
	if [[ ! -x $BUILDER ]]; then
			echo "[ERROR] must install docker or podman. Abort!"; exit 1
	fi
fi
DOCKERFILELOCAL=bootstrap.Dockerfile
cat Dockerfile | sed -r \
	-e "s#FROM scratch#FROM ubi8-minimal#" \
	-e "s#^FROM #FROM registry.redhat.io/#" \
	-e "s#^FROM registry.redhat.io/registry.redhat.io/#FROM registry.redhat.io/#" \
	-e "s#^FROM registry.redhat.io/registry.access.redhat.com/#FROM registry.redhat.io/#" \
	-e "s#^FROM registry.redhat.io/registry-proxy.engineering.redhat.com/#FROM registry-proxy.engineering.redhat.com/#" \
	-e "s%# (COPY .+.repo /etc/yum.repos.d/)%\1%" \
	-e "s%# COPY content_sets%COPY content_sets%" \
	`# CRW-1680 ignore vendor folder and fetch new content` \
	-e "s@(\ +)(.+go build)@\1go mod vendor \&\& \2 -mod=mod@" \
	> ${DOCKERFILELOCAL}
tag=$(pwd);tag=${tag##*/}
${BUILDER} build . -f ${DOCKERFILELOCAL} --target builder -t ${tag}:bootstrap
rm -f ${DOCKERFILELOCAL}

# step two - extract vendor folder to tarball
${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - /go/src/github.com/eclipse/che-jwtproxy/vendor' > "asset-vendor-$(uname -m).tgz"
${BUILDER} rmi ${tag}:bootstrap

# step three - include that tarball's contents in this repo
tar --strip-components=5 -xzf "asset-vendor-$(uname -m).tgz" 
rm -f "asset-vendor-$(uname -m).tgz"

if [[ $(git diff-index HEAD --) ]] || [[ ${forcePull} -eq 1 ]]; then
	git add vendor || true
	log "[INFO] Commit new vendor folder"
	COMMIT_MSG="vendor folder"
	if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" vendor) == *"nothing to commit, working tree clean"* ]]; then 
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
