#!/usr/bin/env groovy
import groovy.transform.Field

// PARAMETERS for this pipeline:
//   SCRATCH
//   FORCE_BUILD
//   REPOS
//   SOURCE_BRANCH

def List SYNC_REPOS = REPOS.tokenize(",").collect { it.trim() }
def String SOURCE_REPO = "redhat-developer/codeready-workspaces-images" // source repo from which to find commits
def DWNSTM_BRANCH = SOURCE_BRANCH // target branch in dist-git repo, eg., crw-2.5-rhel-8

def OLD_SHA=""
def NEW_SHA=""
def SOURCE_SHA=""
timeout(120) {
  node("rhel7-32gb||rhel7-16gb||rhel7-8gb"){ stage "Sync repos"
    wrap([$class: 'TimestamperBuildWrapper']) {
      sh('curl -sSLO https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2.5-rhel-8/product/util.groovy')
      def util = load "${WORKSPACE}/util.groovy"
      cleanWs()
      CRW_VERSION = util.getCrwVersion(DWNSTM_BRANCH)
      println "CRW_VERSION = '" + CRW_VERSION + "'"
      util.installSkopeo(CRW_VERSION)

      currentBuild.description=""

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
            currentBuild.description+="${SYNC_REPOS[i]}"
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
                git add --all -f .
                git commit -s -m "[sync] Update from ''' + SOURCE_REPO + ''' @ ''' + SOURCE_SHA[0..7] + '''"
                git push origin ''' + DWNSTM_BRANCH + ''' || true
              fi''')

            // run get-sources-jenkins to ensure we have the latest sources (in case we clobbered a previous run) and update source repo
            sh('''#!/bin/bash -xe
              export KRB5CCNAME=/var/tmp/crw-build_ccache
              cd ${WORKSPACE}/targetdwn/''' + SYNC_REPOS[i] + '''
              ./get-sources-jenkins.sh -n -p ''' + CRW_VERSION + '''
              COMMIT_SHA="$(git log origin/''' + DWNSTM_BRANCH + '''..''' + DWNSTM_BRANCH + ''' --pretty=format:%H)"
              COMMIT_MSG="$(git log origin/''' + DWNSTM_BRANCH + '''..''' + DWNSTM_BRANCH + ''' --pretty=format:%B)"
              if [ ! -z "$COMMIT_SHA" ] ; then
                for f in $(git diff-tree --no-commit-id --name-only -r "$COMMIT_SHA") ; do
                  cp $f ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''
                done
                git push origin ''' + DWNSTM_BRANCH + ''' || true

                # update source repo with updates from running get-sources-jenkins
                cd ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''
                git add --all -f .
                git commit -m "$COMMIT_MSG" || true
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
              build(
                job: 'get-sources-rhpkg-container-build',
                wait: false,
                propagate: false,
                parameters: [
                  [
                    $class: 'StringParameterValue',
                    name: 'token',
                    value: "CI_BUILD"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'cause',
                    value: QUAY_REPO_PATH + "+respin+by+${BUILD_TAG}"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'GIT_BRANCH',
                    value: "${DWNSTM_BRANCH}"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'GIT_PATHs',
                    value: "containers/" + SYNC_REPOS[i]
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'QUAY_REPO_PATHs',
                    value: "${QUAY_REPO_PATH}"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'JOB_BRANCH',
                    value: "${CRW_VERSION}"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'FORCE_BUILD',
                    value: "true"
                  ],
                  [
                    $class: 'StringParameterValue',
                    name: 'SCRATCH',
                    value: "${SCRATCH}"
                  ]
                ]
              )
              currentBuild.description+=" (brew trigger); "
            } else {
              println "No changes upstream, nothing to commit for ${SYNC_REPOS[i]}"
              currentBuild.description+=" (no changes);"
            }
          } // for

      } // withCredentials
    } // wrap
  } // node
} // timeout
