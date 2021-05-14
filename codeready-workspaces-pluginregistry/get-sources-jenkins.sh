#!/bin/bash -xe

scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
verbose=0

tmpContainer=pluginregistry:tmp

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

docker build -t ${tmpContainer} . --no-cache -f bootstrap.Dockerfile \
  --target builder --build-arg BOOTSTRAP=true

echo "<======= END BOOTSTRAP BUILD ======="
# update tarballs - step 2 - check old sources' tarballs
TARGZs="root-local.tgz resources.tgz"
git rm -f $TARGZs 2>/dev/null || rm -f $TARGZs || true
rhpkg sources

# update tarballs - step 3 - create new tarballs
# NOTE: CRW-1610 used to be in /root/.local but now can be found in /opt/app-root/src/.local
tmpDir="$(mktemp -d)"
docker run --rm -v \
  ${tmpDir}/:/tmp/root-local/ ${tmpContainer} /bin/bash \
  -c 'cd /opt/app-root/src/.local/ && cp -r bin/ lib/ /tmp/root-local/'
MYUID=$(id -u); MYGID=$(id -g); sudo chown -R $MYUID:$MYGID $tmpDir
# check diff
BEFORE_DIR="$(mktemp -d)"
tar xzf root-local.tgz -C ${BEFORE_DIR}
TAR_DIFF=$(diff --suppress-common-lines -u -r ${BEFORE_DIR} ${tmpDir} -x "*.pyc" -x "installed-files.txt") || true
if [[ ${TAR_DIFF} ]]; then
  echo "DIFF START *****"
  echo "${TAR_DIFF}"
  echo "***** END DIFF"
  pushd ${tmpDir} >/dev/null && tar czf root-local.tgz lib/ bin/ && popd >/dev/null && mv -f ${tmpDir}/root-local.tgz .
fi
sudo rm -fr ${tmpDir} ${BEFORE_DIR}

# we always need a fresh resources.tgz to guarantee proper timestamps and latest vsix files
rm -f ./resources.tgz
docker create --name pluginregistryBuilder ${tmpContainer}
docker cp pluginregistryBuilder:/tmp/resources/resources.tgz .
docker rm -f pluginregistryBuilder

docker rmi ${tmpContainer}

# update tarballs - step 4 - commit changes if diff different
if [[ ${TAR_DIFF} ]] || [[ ${TAR_DIFF2} ]] || [[ ${forcePull} -ne 0 ]]; then
  log "[INFO] Commit new sources"
  rhpkg new-sources ${TARGZs}
  COMMIT_MSG="Update ${TARGZs}"
  maxfilesize=$(du -b ${TARGZs} | sed -r -e "s#\t.+##" | sort -Vr | head -1)
  # include any new files...
  git add . -A -f
  # but DON'T include lookaside files in git
  git rm -fr ${TARGZs} 2>/dev/null || true 
  # CRW-1621 a gz resource is larger than 10485760b, so use MaxFileSize to force dist-git to shut up and take my sources!
  if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}
    - MaxFileSize: $maxfilesize
" sources Dockerfile .gitignore . || true) == *"nothing to commit, working tree clean"* ]]; then
    log "[INFO] No new sources, so nothing to build."
  elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Push change:"
    git pull; git push; git status -s || true
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

