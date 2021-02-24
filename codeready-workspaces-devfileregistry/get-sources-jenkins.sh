#!/bin/bash -xe
# script to trigger rhpkg - no sources needed here

set -e

scratchFlag=""
doRhpkgContainerBuild=1
forceBuild=0
forcePull=0
tmpContainer=devfileregistry:tmp
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
sed Dockerfile --regexp-extended \
  -e 's|COPY (.*) resources.tgz (.*)|COPY \1 \2|' \
  -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=true|' \
  -e 's|ARG USE_DIGESTS=.*|ARG USE_DIGESTS=false|' \
  -e 's|^ *COPY root-local.tgz|# &|' \
  `# replace org/container:tag with reg-proxy/rh-osbs/org-container:tag` \
  -e "s#^FROM ([^/:]+)/([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\\1-\\2:\\3#" \
  `# replace ubi8-minimal:tag with reg-proxy/rh-osbs/ubi-minimal:tag` \
  -e "s#^FROM ([^/:]+):([^/:]+)#FROM registry-proxy.engineering.redhat.com/rh-osbs/\\1:\\2#" \
  -e 's|# (COPY .*content_sets.*)|\\1|' \
  > bootstrap.Dockerfile
echo "======= START BOOTSTRAP BUILD =======>"
docker build -t $tmpContainer . --no-cache -f bootstrap.Dockerfile \
  --target builder --build-arg BOOTSTRAP=true --build-arg USE_DIGESTS=false
echo "<======= END BOOTSTRAP BUILD ======="
rhpkg sources

# root-local.tgz
tmpDir=$(mktemp -d)
# NOTE: CRW-1610 used to be in /root/.local but now can be found in /opt/app-root/src/.local
docker run --rm -v $tmpDir:/tmp/root-local/ $tmpContainer /bin/bash \
  -c "cd /opt/app-root/src/.local && cp -r bin/ lib/ /tmp/root-local/"
MYUID=$(id -u); MYGID=$(id -g); sudo chown -R $MYUID:$MYGID $tmpDir
BEFORE_DIR=$(mktemp -d -t before-XXXXXXXXX)
tar xzf root-local.tgz -C ${BEFORE_DIR}
TAR_DIFF=$(diff --suppress-common-lines -u -r ${BEFORE_DIR} ${tmpDir} -x "*.pyc" -x "installed-files.txt") || true
if [[ ${TAR_DIFF} ]]; then
  echo "DIFF START *****"
  echo "${TAR_DIFF}"
  echo "***** END DIFF"
  pushd ${tmpDir} >/dev/null && tar czf root-local.tgz lib/ bin/ && popd >/dev/null && mv -f ${tmpDir}/root-local.tgz .
fi
rm -fr ${tmpDir} ${BEFORE_DIR}

# resources.tgz
tmpDir=$(mktemp -d)
docker run --rm -v $tmpDir:/tmp/resources/ --entrypoint /bin/bash ${tmpContainer} -c \
  "cd /build && cp -r ./devfiles ./resources /tmp/resources/"
MYUID=$(id -u); MYGID=$(id -g); sudo chown -R $MYUID:$MYGID $tmpDir
if [[ -f resources.tgz ]]; then
  BEFORE_DIR=$(mktemp -d -t before-XXXXXXXXX)
  tar xzf resources.tgz -C ${BEFORE_DIR}
  TAR_DIFF2=$(diff --suppress-common-lines -u -r ${BEFORE_DIR} $tmpDir) || true
else
  TAR_DIFF2="No such file resources.tgz -- creating a new one for the first time"
fi
if [[ ${TAR_DIFF2} ]]; then
  echo "DIFF START *****"
  echo "${TAR_DIFF2}"
  echo "***** END DIFF"
  pushd $tmpDir >/dev/null && tar czf resources.tgz ./* && popd >/dev/null && mv -f ${tmpDir}/resources.tgz .
fi
rm -fr ${tmpDir} ${BEFORE_DIR}
rm bootstrap.Dockerfile
docker rmi $tmpContainer

#
# commit changes if different
#
if [[ ${TAR_DIFF} ]] || [[ ${TAR_DIFF2} ]] || [[ ${forcePull} -ne 0 ]]; then
  log "[INFO] Commit new sources"
  rhpkg new-sources root-local.tgz resources.tgz
  COMMIT_MSG="Update root-local.tgz and resources.tgz"
  if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then
    log "[INFO] No new sources, so nothing to build."
  elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Push change:"
    git pull; git push
  fi

if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
  echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
  tmpfile=$(mktemp) && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
  taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
  ERRORS="$(grep "image build failed" $tmpfile)" && rm -f $tmpfile
  if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
fi
else
  if [[ ${forceBuild} -eq 1 ]]; then
    echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
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
