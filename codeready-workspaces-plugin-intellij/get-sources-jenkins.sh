#!/bin/bash -xe
# script to trigger rhpkg - no sources needed here

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

FLUXBOX_VERSION="1.3.7-11" # see https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/f/
IMLIB2_VERSION="1.4.9-8" # see https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/i/
PYXDG_VERSION="0.25-16" # see http://mirror.centos.org/centos/8/AppStream/x86_64/os/Packages/
ALECZAPKA_FONTS_VERSION="1.3-25" # see https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/

# patch Dockerfile to record versions we expect
sed Dockerfile \
    -e "s#FLUXBOX_VERSION=\"\([^\"]\+\)\"#FLUXBOX_VERSION=\"${FLUXBOX_VERSION}\"#" \
    -e "s#IMLIB2_VERSION=\"\([^\"]\+\)\"#IMLIB2_VERSION=\"${IMLIB2_VERSION}\"#" \
    -e "s#PYXDG_VERSION=\"\([^\"]\+\)\"#PYXDG_VERSION=\"${PYXDG_VERSION}\"#" \
    -e "s#ALECZAPKA_FONTS_VERSION=\"\([^\"]\+\)\"#ALECZAPKA_FONTS_VERSION=\"${ALECZAPKA_FONTS_VERSION}\"#" \
    > Dockerfile.2

if [[ $(diff -U 0 --suppress-common-lines -b Dockerfile Dockerfile.2) ]] || [[ ${forcePull} -eq 1 ]]; then
  rm -fr *.rpm *.tar.gz
  mv -f Dockerfile.2 Dockerfile
  
  ARCHES="x86_64 s390x ppc64le"

  curl -sSLO https://download.jetbrains.com/idea/ideaIC-2020.2.2.tar.gz
  for ARCH in $ARCHES ; do
    curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/${ARCH}/Packages/f/fluxbox-${FLUXBOX_VERSION}.el8.${ARCH}.rpm
    curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/${ARCH}/Packages/i/imlib2-${IMLIB2_VERSION}.el8.${ARCH}.rpm
  done
  curl -sSLO http://mirror.centos.org/centos/8/AppStream/x86_64/os/Packages/python3-pyxdg-${PYXDG_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-anorexia-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-aqui-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-cure-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-drift-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-edges-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-fkp-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-gelly-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-glisp-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-kates-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-lime-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-mints-mild-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-mints-strong-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-nu-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-smoothansi-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-snap-fonts-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  curl -sSLO https://download-ib01.fedoraproject.org/pub/epel/8/Everything/x86_64/Packages/a/artwiz-aleczapka-fonts-common-${ALECZAPKA_FONTS_VERSION}.el8.noarch.rpm
  
  log "[INFO] Upload new sources: $(ls *.rpm *.tar.gz)"
  rhpkg new-sources *.rpm *.tar.gz
  log "[INFO] Commit new sources"
  COMMIT_MSG="FLUXBOX_VERSION ${FLUXBOX_VERSION}, IMLIB2_VERSION ${IMLIB2_VERSION}, PYXDG_VERSION ${PYXDG_VERSION}, ALECZAPKA_FONTS_VERSION ${ALECZAPKA_FONTS_VERSION}"
  if [[ $(git commit -s -m "[get sources] ${COMMIT_MSG}" sources Dockerfile .gitignore) == *"nothing to commit, working tree clean"* ]]; then 
    log "[INFO] No new sources, so nothing to build."
  elif [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    log "[INFO] Push change:"
    git pull; git push
  fi
  if [[ ${doRhpkgContainerBuild} -eq 1 ]]; then
    echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=`mktemp` && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(egrep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  fi
else
  if [[ ${forceBuild} -eq 1 ]]; then
    echo "[INFO] Trigger container-build in current branch: rhpkg container-build ${scratchFlag}"
    tmpfile=`mktemp` && rhpkg container-build ${scratchFlag} --nowait | tee 2>&1 $tmpfile
    taskID=$(cat $tmpfile | grep "Created task:" | sed -e "s#Created task:##") && brew watch-logs $taskID | tee 2>&1 $tmpfile
    ERRORS="$(egrep "image build failed" $tmpfile)" && rm -f $tmpfile
    if [[ "$ERRORS" != "" ]]; then echo "Brew build has failed:

$ERRORS

"; exit 1; fi
  else
    log "[INFO] No new sources, so nothing to build."
  fi
fi

# cleanup
rm -f Dockerfile.2
