#!/usr/bin/env groovy
import groovy.transform.Field

// PARAMETERS for this pipeline:
//   SCRATCH
//   FORCE_BUILD
//   REPOS
//   SOURCE_BRANCH

def List SYNC_REPOS = REPOS.tokenize(",").collect { it.trim() }
def String SOURCE_REPO = "redhat-developer/codeready-workspaces-images" // source repo from which to find commits
def NODE_LABEL = "s390x-rhel7-beaker" // s390x-rhel7-beaker, rhel7-releng where to run sync job
def DWNSTM_BRANCH = SOURCE_BRANCH // target branch in dist-git repo, eg., crw-2.5-rhel-8

def OLD_SHA=""
def NEW_SHA=""
def SOURCE_SHA=""
timeout(120) {
  node("${NODE_LABEL}"){ stage "Sync repos"
    wrap([$class: 'TimestamperBuildWrapper']) {
      sh('curl -sSLO https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2.5-rhel-8/product/util.groovy')
      def util = load "${WORKSPACE}/util.groovy"
      cleanWs()
      CRW_VERSION = util.getCrwVersion(DWNSTM_BRANCH)
      println "CRW_VERSION = '" + CRW_VERSION + "'"
      util.installSkopeo(CRW_VERSION)

      withCredentials([string(credentialsId:'devstudio-release.token', variable: 'GITHUB_TOKEN'),
        file(credentialsId: 'crw-build.keytab', variable: 'CRW_KEYTAB')]) {
          util.bootstrap(CRW_KEYTAB)
          println "########################################################################################################"
          println "##  Clone and update github.com/${SOURCE_REPO}.git"
          println "########################################################################################################"
          util.cloneRepo("https://github.com/${SOURCE_REPO}.git", "${WORKSPACE}/sources", SOURCE_BRANCH)
          util.updateBaseImages("${WORKSPACE}/sources", SOURCE_BRANCH)
          SOURCE_SHA = util.getLastCommitSHA("${WORKSPACE}/sources")
          println "Got SOURCE_SHA in sources folder: " + SOURCE_SHA

          for (int i=0; i < SYNC_REPOS.size(); i++) {
            println "########################################################################################################"
            println "##  Sync ${SYNC_REPOS[i]} to pkgs.devel"
            println "########################################################################################################"
            util.cloneRepo("ssh://crw-build@pkgs.devel.redhat.com/containers/${SYNC_REPOS[i]}", "${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}", DWNSTM_BRANCH)

            sh('''rsync -avhz --checksum --delete --exclude .git/ ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''/ ${WORKSPACE}/targetdwn/''' + SYNC_REPOS[i])

            OLD_SHA = util.getLastCommitSHA("${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}")
            println "Got OLD_SHA in targetdwn/${SYNC_REPOS[i]} folder: " + OLD_SHA

            // push to dist-git
            sh('''#!/bin/bash -xe
              cd ${WORKSPACE}/targetdwn/''' + SYNC_REPOS[i] + '''
              if [[ \$(git diff --name-only) ]]; then # file changed
                export KRB5CCNAME=/var/tmp/crw-build_ccache
                git add .
                git commit -s -m "[sync] Update from ''' + SOURCE_REPO + ''' @ ''' + SOURCE_SHA[0..7] + '''"
                git push origin ''' + DWNSTM_BRANCH + ''' || true
              fi''')

            // run get-sources-jenkins to ensure we have the latest sources (in case we clobbered a previous run) and update source repo
            sh('''#!/bin/bash -xe
              export KRB5CCNAME=/var/tmp/crw-build_ccache
              cd ${WORKSPACE}/targetdwn/''' + SYNC_REPOS[i] + '''
              ./get-sources-jenkins.sh -n ''' + CRW_VERSION + '''
              COMMIT_SHA="$(git log origin/crw-2.5-rhel-8..crw-2.5-rhel-8 --pretty=format:%H)"
              COMMIT_MSG="$(git log origin/crw-2.5-rhel-8..crw-2.5-rhel-8 --pretty=format:%B)"
              if [ ! -z "$COMMIT_SHA" ] ; then
                for f in $(git diff-tree --no-commit-id --name-only -r "$COMMIT_SHA") ; do
                  cp $f ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''
                done
                git push origin ''' + DWNSTM_BRANCH + ''' || true

                # update source repo with updates from running get-sources-jenkins
                cd ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''
                git commit -am "$COMMIT_MSG" || true
                git push origin ''' + SOURCE_BRANCH + ''' || true
              fi
            ''')

            NEW_SHA = util.getLastCommitSHA("${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}")
            println "Got NEW_SHA in targetdwn/${SYNC_REPOS[i]} folder: " + NEW_SHA

            if (NEW_SHA != OLD_SHA || FORCE_BUILD == "true") {
              QUAY_REPO_PATH=""
              if (SCRATCH == "false") {
                QUAY_REPO_PATH=util.getCRWShortName(SYNC_REPOS[i]) + "-rhel8"
              }
              // kick off get-sources-rhpkg-container-build job
              sh('''#!/bin/bash -xe
                curl \
                  "https://codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com/job/get-sources-rhpkg-container-build/buildWithParameters?\
token=CI_BUILD&\
cause=${QUAY_REPO_PATH}+respin+by+${BUILD_TAG}&\
GIT_BRANCH=''' + DWNSTM_BRANCH + '''&\
GIT_PATHs=containers/''' + SYNC_REPOS[i] + '''&\
QUAY_REPO_PATHs=''' + QUAY_REPO_PATH + '''&\
JOB_BRANCH=''' + CRW_VERSION + '''&\
FORCE_BUILD=true&\
SCRATCH=''' + SCRATCH + '''"''')
            } else {
              println "No changes upstream, nothing to commit"
            }
          } // for

      } // withCredentials
    } // wrap
  } // node
} // timeout
