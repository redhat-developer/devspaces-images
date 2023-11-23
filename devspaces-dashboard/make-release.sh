#!/bin/bash
#
# Copyright (c) 2020-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# Release process automation script.
# Used to create branch/tag, update VERSION files
# and and trigger release by force pushing changes to the release branch

# set to 1 to actually tag the changes to the release branch
TAG_RELEASE=0
NOCOMMIT=0

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-t'|'--tag-release') TAG_RELEASE=1; NOCOMMIT=0; shift 0;;
    '-v'|'--version') VERSION="$2"; shift 1;;
    '-n'|'--no-commit') NOCOMMIT=1; TAG_RELEASE=0; shift 0;;
  esac
  shift 1
done

sed_in_place() {
    SHORT_UNAME=$(uname -s)
  if [ "$(uname)" == "Darwin" ]; then
    sed -i '' "$@"
  elif [ "${SHORT_UNAME:0:5}" == "Linux" ]; then
    sed -i "$@"
  fi
}


bump_version () {
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  NEXT_VERSION=$1
  BUMP_BRANCH=$2

  git checkout "${BUMP_BRANCH}"

  echo "Updating project version to ${NEXT_VERSION}"
  update_pkgs_versions $NEXT_VERSION

  if [[ ${NOCOMMIT} -eq 0 ]]; then
    COMMIT_MSG="chore: Bump to ${NEXT_VERSION} in ${BUMP_BRANCH}"
    git commit -asm "${COMMIT_MSG}"
    git pull origin "${BUMP_BRANCH}"

    set +e
    PUSH_TRY="$(git push origin "${BUMP_BRANCH}")"
    # shellcheck disable=SC2181
    if [[ $? -gt 0 ]] || [[ $PUSH_TRY == *"protected branch hook declined"* ]]; then
        # create pull request for main branch, as branch is restricted
        PR_BRANCH=pr-${BUMP_BRANCH}-to-${NEXT_VERSION}
        git branch "${PR_BRANCH}"
        git checkout "${PR_BRANCH}"
        git pull origin "${PR_BRANCH}"
        git push origin "${PR_BRANCH}"
        gh pr create -f -B "${BUMP_BRANCH}" -H "${PR_BRANCH}"
    fi
    set -e
  fi
  git checkout "${CURRENT_BRANCH}"
}

function update_pkgs_versions() {
  local VER=$1
  # update root `package.json` version
  npm --no-git-tag-version version --allow-same-version "${VER}"
  # update each package version
  lerna version --no-git-tag-version -y "${VER}"
  if [[ ${VER} != *"-next" ]]; then
    # update devworkspace generator version for release
    jq ".\"dependencies\".\"@eclipse-che/che-devworkspace-generator\" = \"${VER}\"" packages/dashboard-backend/package.json > packages/dashboard-backend/package.json.update
    mv packages/dashboard-backend/package.json.update packages/dashboard-backend/package.json
  elif [[ "${BASEBRANCH}" == "${BRANCH}" ]]; then
    # update devworkspace generator version only for bugfix branch version bump
    jq ".\"dependencies\".\"@eclipse-che/che-devworkspace-generator\" = \"next-${BRANCH}\"" packages/dashboard-backend/package.json > packages/dashboard-backend/package.json.update
    mv packages/dashboard-backend/package.json.update packages/dashboard-backend/package.json
  fi
  # update excluded dependencies vesion
  sed_in_place -e "s/@eclipse-che\/dashboard-backend@.*\`/@eclipse-che\/dashboard-backend@${VER}\`/" .deps/EXCLUDED/prod.md
  sed_in_place -e "s/@eclipse-che\/dashboard-frontend@.*\`/@eclipse-che\/dashboard-frontend@${VER}\`/" .deps/EXCLUDED/prod.md
  sed_in_place -e "s/@eclipse-che\/common@.*\`/@eclipse-che\/common@${VER}\`/" .deps/EXCLUDED/prod.md
  # we don't have all deps resolved. So, do no fail in case of failure
  # yarn license:generate || true
}

usage ()
{
  echo "Usage: $0 --version [VERSION TO RELEASE] [--tag-release]"
  echo "Example: $0 --version 7.75.0 --tag-release"; echo
}

if [[ ! ${VERSION} ]]; then
  usage
  exit 1
fi

# derive branch from version
BRANCH=${VERSION%.*}.x

# if doing a .0 release, use main; if doing a .z release, use $BRANCH
if [[ ${VERSION} == *".0" ]]; then
  BASEBRANCH="main"
else
  BASEBRANCH="${BRANCH}"
fi

# get sources from ${BASEBRANCH} branch
git fetch origin "${BASEBRANCH}":"${BASEBRANCH}"
git checkout "${BASEBRANCH}"

# create new branch off ${BASEBRANCH} (or check out latest commits if branch already exists), then push to origin
if [[ "${BASEBRANCH}" != "${BRANCH}" ]]; then
  git branch "${BRANCH}" || git checkout "${BRANCH}" && git pull origin "${BRANCH}"
  git push origin "${BRANCH}"
  git fetch origin "${BRANCH}:${BRANCH}"
  git checkout "${BRANCH}"
fi

set -e

update_pkgs_versions $VERSION

# commit change into branch
if [[ ${NOCOMMIT} -eq 0 ]]; then
  COMMIT_MSG="chore: release: bump to ${VERSION} in ${BRANCH}"
  git commit -asm "${COMMIT_MSG}"
  git pull origin "${BRANCH}"
  git push origin "${BRANCH}"
fi

if [[ $TAG_RELEASE -eq 1 ]]; then
  # tag the release
  git checkout "${BRANCH}"
  git tag "${VERSION}"
  git push origin "${VERSION}"
fi

# now update ${BASEBRANCH} to the new version
git checkout "${BASEBRANCH}"

# change VERSION file + commit change into ${BASEBRANCH} branch
if [[ "${BASEBRANCH}" != "${BRANCH}" ]]; then
  # bump the y digit, if it is a major release
  [[ $BRANCH =~ ^([0-9]+)\.([0-9]+)\.x ]] && BASE=${BASH_REMATCH[1]}; NEXT=${BASH_REMATCH[2]}; (( NEXT=NEXT+1 )) # for BRANCH=7.10.x, get BASE=7, NEXT=11
  NEXT_VERSION_Y="${BASE}.${NEXT}.0-next"
  bump_version "${NEXT_VERSION_Y}" "${BASEBRANCH}"
fi
# bump the z digit
[[ $VERSION =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]] && BASE="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"; NEXT="${BASH_REMATCH[3]}"; (( NEXT=NEXT+1 )) # for VERSION=7.7.1, get BASE=7.7, NEXT=2
NEXT_VERSION_Z="${BASE}.${NEXT}-next"
bump_version "${NEXT_VERSION_Z}" "${BRANCH}"
