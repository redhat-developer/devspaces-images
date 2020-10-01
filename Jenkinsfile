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

@Field String CRW_VERSION_F = ""
def String getCrwVersion(String BRANCH) {
  if (CRW_VERSION_F.equals("")) {
    CRW_VERSION_F = sh(script: '''#!/bin/bash -xe
    curl -sSLo- https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/''' + BRANCH + '''/dependencies/VERSION''', returnStdout: true).trim()
  }
  return CRW_VERSION_F
}

def installSkopeo(String CRW_VERSION)
{
sh '''#!/bin/bash -xe
pushd /tmp >/dev/null
# remove any older versions
sudo yum remove -y skopeo || true
# install from @kcrane build
if [[ ! -x /usr/local/bin/skopeo ]]; then
    sudo curl -sSLO "https://codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com/job/crw-deprecated_''' + CRW_VERSION + '''/lastSuccessfulBuild/artifact/codeready-workspaces-deprecated/skopeo/target/skopeo-$(uname -m).tar.gz"
fi
if [[ -f /tmp/skopeo-$(uname -m).tar.gz ]]; then
    sudo tar xzf /tmp/skopeo-$(uname -m).tar.gz --overwrite -C /usr/local/bin/
    sudo chmod 755 /usr/local/bin/skopeo
    sudo rm -f /tmp/skopeo-$(uname -m).tar.gz
fi
popd >/dev/null
skopeo --version
'''
}

def cloneRepo(String URL, String REPO_PATH, String BRANCH) {
  // Requires withCredentials() and bootstrap()
  if (!fileExists(REPO_PATH)) {
    if (URL.indexOf("pkgs.devel.redhat.com") == -1) {
      def AUTH_URL="https://\$GITHUB_TOKEN:x-oauth-basic@" + URL.minus("http://").minus("https://")
      checkout([$class: 'GitSCM',
        branches: [[name: BRANCH]],
        doGenerateSubmoduleConfigurations: false,
        credentialsId: 'devstudio-release',
        poll: true,
        extensions: [
          [$class: 'RelativeTargetDirectory', relativeTargetDir: REPO_PATH],
          [$class: 'DisableRemotePoll']
        ],
        submoduleCfg: [],
        userRemoteConfigs: [[url: URL]]])
      sh('''#!/bin/bash -xe
        cd ''' + REPO_PATH + '''
        git checkout --track origin/''' + BRANCH + ''' || true
        export GITHUB_TOKEN=''' + GITHUB_TOKEN + ''' # echo "''' + GITHUB_TOKEN + '''"
        git config user.email "nickboldt+devstudio-release@gmail.com"
        git config user.name "Red Hat Devstudio Release Bot"
        git config --global push.default matching

        # SOLVED :: Fatal: Could not read Username for "https://github.com", No such device or address :: https://github.com/github/hub/issues/1644
        git remote -v
        git config --global hub.protocol https
        git remote set-url origin ''' + AUTH_URL + '''
        git remote -v''')
    } else {
      sh('''#!/bin/bash -xe
        export KRB5CCNAME=/var/tmp/crw-build_ccache
        git clone ''' + URL + ''' ''' + REPO_PATH + '''
        cd ''' + REPO_PATH + '''
        git checkout --track origin/''' + BRANCH + ''' || true
        git config user.email crw-build@REDHAT.COM
        git config user.name "CRW Build"
        git config --global push.default matching''')
    }
  }
}

def updateBaseImages(String REPO_PATH, String BRANCH, String FLAGS="") {
  // Requires installSkopeo()
  def String updateBaseImages_bin="${WORKSPACE}/updateBaseImages.sh"
  if (!fileExists(updateBaseImages_bin)) {
    sh('''#!/bin/bash -xe
      curl -L -s -S https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/''' + BRANCH + '''/product/updateBaseImages.sh -o ''' + updateBaseImages_bin + '''
      chmod +x ''' + updateBaseImages_bin)
  }
  sh('''#!/bin/bash -xe
    cd ''' + REPO_PATH + '''
    export GITHUB_TOKEN=''' + GITHUB_TOKEN + ''' # echo "''' + GITHUB_TOKEN + '''"
    ''' + updateBaseImages_bin + ''' -b ''' + BRANCH + ''' ''' + FLAGS)
}

def getLastCommitSHA(String REPO_PATH) {
  return sh(script: '''#!/bin/bash -xe
    cd ''' + REPO_PATH + '''
    git rev-parse HEAD''', returnStdout: true)
}

def getCRWShortName(String LONG_NAME) {
  if (LONG_NAME == "codeready-workspaces") {
    return "server"
  }
  return LONG_NAME.minus("codeready-workspaces-")
}

def bootstrap(String CRW_KEYTAB) {
sh '''#!/bin/bash -xe
# bootstrapping: if keytab is lost, upload to
# https://codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com/credentials/store/system/domain/_/
# then set Use secret text above and set Bindings > Variable (path to the file) as ''' + CRW_KEYTAB + '''
chmod 700 ''' + CRW_KEYTAB + ''' && chown ''' + USER + ''' ''' + CRW_KEYTAB + '''
# create .k5login file
echo "crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com@REDHAT.COM" > ~/.k5login
chmod 644 ~/.k5login && chown ''' + USER + ''' ~/.k5login
 echo "pkgs.devel.redhat.com,10.19.208.80 ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAplqWKs26qsoaTxvWn3DFcdbiBxqRLhFngGiMYhbudnAj4li9/VwAJqLm1M6YfjOoJrj9dlmuXhNzkSzvyoQODaRgsjCG5FaRjuN8CSM/y+glgCYsWX1HFZSnAasLDuW0ifNLPR2RBkmWx61QKq+TxFDjASBbBywtupJcCsA5ktkjLILS+1eWndPJeSUJiOtzhoN8KIigkYveHSetnxauxv1abqwQTk5PmxRgRt20kZEFSRqZOJUlcl85sZYzNC/G7mneptJtHlcNrPgImuOdus5CW+7W49Z/1xqqWI/iRjwipgEMGusPMlSzdxDX4JzIx6R53pDpAwSAQVGDz4F9eQ==
" >> ~/.ssh/known_hosts

ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# see https://mojo.redhat.com/docs/DOC-1071739
if [[ -f ~/.ssh/config ]]; then mv -f ~/.ssh/config{,.BAK}; fi
echo "
GSSAPIAuthentication yes
GSSAPIDelegateCredentials yes

Host pkgs.devel.redhat.com
User crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com@REDHAT.COM
" > ~/.ssh/config
chmod 600 ~/.ssh/config

# initialize kerberos
export KRB5CCNAME=/var/tmp/crw-build_ccache
kinit "crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com@REDHAT.COM" -kt ''' + CRW_KEYTAB + '''
klist # verify working
'''
}

def OLD_SHA=""
def NEW_SHA=""
def SOURCE_SHA=""
timeout(120) {
  node("${NODE_LABEL}"){ stage "Sync repos"
    wrap([$class: 'TimestamperBuildWrapper']) {
      cleanWs()
      CRW_VERSION = getCrwVersion(DWNSTM_BRANCH)
      println "CRW_VERSION = '" + CRW_VERSION + "'"
      installSkopeo(CRW_VERSION)

      withCredentials([string(credentialsId:'devstudio-release.token', variable: 'GITHUB_TOKEN'),
        file(credentialsId: 'crw-build.keytab', variable: 'CRW_KEYTAB')]) {
          bootstrap(CRW_KEYTAB)
          println "########################################################################################################"
          println "##  Clone and update github.com/${SOURCE_REPO}.git"
          println "########################################################################################################"
          cloneRepo("https://github.com/${SOURCE_REPO}.git", "${WORKSPACE}/sources", SOURCE_BRANCH)
          updateBaseImages("${WORKSPACE}/sources", SOURCE_BRANCH)
          SOURCE_SHA = getLastCommitSHA("${WORKSPACE}/sources")
          println "Got SOURCE_SHA in sources folder: " + SOURCE_SHA

          for (int i=0; i < SYNC_REPOS.size(); i++) {
            println "########################################################################################################"
            println "##  Sync ${SYNC_REPOS[i]} to pkgs.devel"
            println "########################################################################################################"
            cloneRepo("ssh://crw-build@pkgs.devel.redhat.com/containers/${SYNC_REPOS[i]}", "${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}", DWNSTM_BRANCH)

            sh('''rsync -avhz --checksum --delete --exclude .git/ ${WORKSPACE}/sources/''' + SYNC_REPOS[i] + '''/ ${WORKSPACE}/targetdwn/''' + SYNC_REPOS[i])

            OLD_SHA = getLastCommitSHA("${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}")
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

            NEW_SHA = getLastCommitSHA("${WORKSPACE}/targetdwn/${SYNC_REPOS[i]}")
            println "Got NEW_SHA in targetdwn/${SYNC_REPOS[i]} folder: " + NEW_SHA

            if (NEW_SHA != OLD_SHA || FORCE_BUILD == "true") {
              QUAY_REPO_PATH=""
              if (SCRATCH == "false") {
                QUAY_REPO_PATH=getCRWShortName(SYNC_REPOS[i]) + "-rhel8"
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
