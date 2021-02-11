#!/bin/bash -xe

set -e

scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
tmpContainer=imagepuller:tmp
verbose=1
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-n'|'--nobuild') doRhpkgContainerBuild=0; shift 0;;
    '-f'|'--force-build') forceBuild=1; shift 0;;
    '-p'|'--force-pull') forcePull=1; shift 0;;
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

#
# create tarballs
#
# step 1 - build the container
CONTAINERNAME="imagepullerbuilder"
# transform Brew friendly Dockerfile so we can use it in Jenkins where base images need full registry path
sed Dockerfile --regexp-extended \
  -e 's|^ *COPY resources.tgz|# &|' \
  -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=true|' \
  `# replace org/container:tag with reg-proxy/rh-osbs/org-container:tag` \
  `# DISABLED -e "s#^FROM ([^/:]+)/([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\\1-\\2:\\3#"` \
  -e "s#^FROM ([^/:]+)/([^/:]+):([^/:]+)#FROM registry.redhat.io/\\1/\\2:\\3#" \
  `# replace ubi8-minimal:tag with reg-proxy/rh-osbs/ubi-minimal:tag` \
  `# DISABLED -e "s#^FROM ([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\\1:\\2#"` \
  -e "s#^FROM ([^/:]+):([^/:]+)#FROM registry.redhat.io/\\1:\\2#" \
  > bootstrap.Dockerfile
echo "======= BOOTSTRAP DOCKERFILE =======>"
cat bootstrap.Dockerfile
echo "<======= BOOTSTRAP DOCKERFILE ======="
echo "======= START BOOTSTRAP BUILD =======>"
docker build -t ${CONTAINERNAME} . --no-cache -f bootstrap.Dockerfile \
  --target builder --build-arg BOOTSTRAP=true
echo "<======= END BOOTSTRAP BUILD ======="
# update tarballs - step 2 - create tarballs in targetdwn folder
RESOURCES_TAR=$(mktemp --suffix=.tar.gz)
RESOURCES_DIR=$(mktemp -d)
docker run --rm --entrypoint sh ${CONTAINERNAME} -c 'tar -pzcf - \
    /opt/app-root/src/go/pkg/mod' > $RESOURCES_TAR
mkdir -p $RESOURCES_DIR
tar xvzf $RESOURCES_TAR -C $RESOURCES_DIR
# update tarballs - step 3 - check old sources' tarballs
# TODO is there a better way to determine if we need to push sources?
rhpkg sources
# check diff
if [[ -f resources.tgz ]]; then
  BEFORE_DIR=$(mktemp -d)
  mkdir ${BEFORE_DIR} && tar xzf resources.tgz -C ${BEFORE_DIR}
  TAR_DIFF=$(sudo diff --suppress-common-lines -u -r ${BEFORE_DIR} $RESOURCES_DIR) || true
else
  TAR_DIFF="No such file resources.tgz -- creating a new one for the first time"
fi
if [[ ${TAR_DIFF} ]]; then
  echo "DIFF START *****"
  echo "${TAR_DIFF}"
  echo "***** END DIFF"
  mv -f $RESOURCES_TAR ./resources.tgz
fi
# update tarballs - step 4 - commit changes if diff different
if [[ ${TAR_DIFF} ]] || [[ ${forcePull} -ne 0 ]]; then
  log "[INFO] Commit new sources"
  rhpkg new-sources resources.tgz
  git commit -s -m "[tgz] Update resources.tgz" sources
  git push
else
  log "[INFO] No changes since previous tarball was created."
fi
# clean up diff dirs
sudo rm -fr "$RESOURCES_DIR" "$BEFORE_DIR"

#
# do build
#
if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
  log "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
  tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
  taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
  ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
  if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
else
  if [[ ${forceBuild} -eq 1 ]]; then
    log "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
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
