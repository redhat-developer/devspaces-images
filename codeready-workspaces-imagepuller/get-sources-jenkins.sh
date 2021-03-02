#!/bin/bash -xe

scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
tmpContainer=imagepuller:tmp
verbose=0

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

#
# create/update sources tarballs (needed for offline Brew builds)
#

# transform Brew friendly Dockerfile so we can use it in Jenkins where base images need full registry path
sed Dockerfile --regexp-extended \
  -e 's|^ *COPY resources.tgz|# &|' \
  -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=true|' \
  `# replace org/container:tag with reg-proxy/rh-osbs/org-container:tag` \
  -e "s#^FROM ([^/:]+)/([^/:]+):([^/:]+)#FROM registry.redhat.io/\1/\2:\3#" \
  `# replace ubi8-minimal:tag with reg-proxy/rh-osbs/ubi-minimal:tag` \
  -e "s#^FROM ([^/:]+):([^/:]+)#FROM registry.redhat.io/\1:\2#" \
  > bootstrap.Dockerfile
echo "======= BOOTSTRAP DOCKERFILE =======>"
cat bootstrap.Dockerfile
echo "<======= BOOTSTRAP DOCKERFILE ======="
echo "======= START BOOTSTRAP BUILD =======>"
docker build -t ${tmpContainer} . --no-cache -f bootstrap.Dockerfile \
  --target builder --build-arg BOOTSTRAP=true
echo "<======= END BOOTSTRAP BUILD ======="
# update tarballs - step 2 - check old sources' tarballs
TARGZs="resources.tgz"
git rm -f $TARGZs 2>/dev/null || rm -f $TARGZs || true
rhpkg sources

# update tarballs - step 3 - create new tarballs 
RESOURCES_TAR=$(mktemp --suffix=.tar.gz)
RESOURCES_DIR=$(mktemp -d)
docker run --rm --entrypoint sh ${tmpContainer} -c 'tar -pzcf - \
    /opt/app-root/src/go/pkg/mod' > $RESOURCES_TAR
mkdir -p $RESOURCES_DIR
tar xzf $RESOURCES_TAR -C $RESOURCES_DIR

# check diff
if [[ -f resources.tgz ]]; then
  BEFORE_DIR=$(mktemp -d)
  mkdir -p ${BEFORE_DIR} && tar xzf resources.tgz -C ${BEFORE_DIR}
  TAR_DIFF=$(sudo diff --suppress-common-lines -u -r ${BEFORE_DIR} $RESOURCES_DIR) || true
  sudo rm -fr ${BEFORE_DIR}
else
  TAR_DIFF="No such file resources.tgz -- creating a new one for the first time"
fi
if [[ ${TAR_DIFF} ]]; then
  echo "DIFF START *****"
  echo "${TAR_DIFF}"
  echo "***** END DIFF"
  mv -f $RESOURCES_TAR ./resources.tgz
fi

sudo rm -fr ${RESOURCES_DIR}
rm bootstrap.Dockerfile
docker rmi ${tmpContainer}
# update tarballs - step 4 - commit changes if diff different
if [[ ${TAR_DIFF} ]] || [[ ${forcePull} -ne 0 ]]; then
  log "[INFO] Commit new sources"
  rhpkg new-sources ${TARGZs}
  COMMIT_MSG="Update ${TARGZs}"
  git add . -A -f
  # CRW-1621 a gz resource is larger than 10485760b, so use MaxFileSize to force dist-git to shut up and take my sources!
  if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}
    - MaxFileSize: $(du -b *gz | sed -r -e "s#\t.+##" | sort -Vr | head -1)
" sources Dockerfile .gitignore . || true) == *"nothing to commit, working tree clean"* ]]; then
    log "[INFO] No new sources, so nothing to build."
  elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Push change:"
    git pull; git push
  fi

  if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  fi
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

