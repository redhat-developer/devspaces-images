// map branch to floating quay tag to create
def FLOATING_QUAY_TAGS = [
    "2.9": "2.9",
    "2.10":"latest",
    "2.x": "nightly"
    ]
def JOB_BRANCHES = ["2.9":"", "2.10":"", "2.x":""]
def JOB_DISABLED = ["2.9":true, "2.10":true, "2.x":false]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
<li>Pull latest tarballs from the upstream builds and sync jobs, and build in Brew.

<li>push those to pkgs.devel repo w/ rhpkg, and 
<li>trigger a new <a 
href=https://brewweb.engineering.redhat.com/brew/tasks?state=all&owner=crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com&view=flat&method=buildContainer&order=-id>
OSBS build</a>
<li>Then <a href=../push-latest-container-to-quay_''' + JOB_BRANCH + '''/>push the latest container to quay</a>

To rebuild all the containers, see <a href="../Releng/job/build-all-images_''' + JOB_BRANCH + '''/">build-all-images_''' + JOB_BRANCH + '''</a>
''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            disableResumeJobProperty()
        }

        throttleConcurrentBuilds {
            maxPerNode(2)
            maxTotal(10)
        }

        // limit builds to 1 every 2 mins
        quietPeriod(120) // in sec

        logRotator {
            daysToKeep(14)
            numToKeep(25)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        // NOTE: send email notification to culprits(), developers(), requestor() for failure - use util.notifyBuildFailed() in .jenkinsfile

        parameters{
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
            stringParam("GIT_PATHs", "containers/codeready-workspaces", '''git path to clone from ssh://crw-build@pkgs.devel.redhat.com/GIT_PATHs, <br/>
update sources, and run rhpkg container-build: <br/>
* containers/codeready-workspaces, <br/>
* containers/codeready-workspaces-operator, <br/>
* containers/codeready-workspaces-plugin-java11, etc.<br/>
''')
            stringParam("QUAY_REPO_PATHs", "", '''If blank, do not push to Quay.<br/>
If set, push to quay.io path, <br/>
eg., one or more of these (space-separated values): <br/>
* server-rhel8, crw-2-rhel8-operator, crw-2-rhel8-operator-metadata, stacks-*-rhel8, plugin-*-rhel8, etc.<br/>
---<br/>
See complete list at <a href=../push-latest-container-to-quay_''' + JOB_BRANCH + '''>push-latest-container-to-quay</a>''')
            stringParam("UPDATE_BASE_IMAGES_FLAGS", "", "Pass additional flags to updateBaseImages, eg., '--tag 1.13'")
            stringParam("nodeVersion", "", "Leave blank if not needed")
            stringParam("yarnVersion", "", "Leave blank if not needed")
            stringParam("FLOATING_QUAY_TAGS", FLOATING_QUAY_TAGS[JB.key], "Update :" + FLOATING_QUAY_TAGS[JB.key] + " tag in addition to latest (2.y-zz) and base (2.y) tags.")
            booleanParam("SCRATCH", true, "By default make a scratch build. Set to false to NOT do a scratch build.")
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/get-sources-rhpkg-container-build_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}