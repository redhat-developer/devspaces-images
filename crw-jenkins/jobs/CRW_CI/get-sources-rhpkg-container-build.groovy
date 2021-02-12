def JOB_BRANCHES = ["2.6":"7.24.x", "2.7":"7.26.x", "2":"master"]
def JOB_DISABLED = ["2.6":true, "2.7":false, "2":true]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value
    JOB_BRANCH=JB.key
    MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    if (JOB_BRANCH.equals("2")) { jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH + ".x" }
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
<li>Pull latest tarballs from the upstream builds and sync jobs, and build in Brew.

<li>push those to pkgs.devel repo w/ rhpkg, and 
<li>trigger a new <a 
href=https://brewweb.engineering.redhat.com/brew/tasks?state=all&owner=crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com&view=flat&method=buildContainer&order=-id>
OSBS build</a>
<li>Then <a href=../push-latest-container-to-quay_''' + JOB_BRANCH + '''/>push the latest container to quay</a>

<p>TODO: migrate old job <a href=https://codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com/view/CRW_CI/view/Pipelines_2.4/job/rebuild-all-rhpkg-container-builds_2.4/>rebuild-all-rhpkg-container-builds_2.4</a> to this server. 
<!-- Looking to rebuild all the containers? See <a href="../rebuild-all-rhpkg-container-builds_''' + JOB_BRANCH + '''/">rebuild-all-rhpkg-container-builds_''' + JOB_BRANCH + '''</a> -->

<p>TODO: need a way to identify builds which should NOT update the <b>:latest</b> tag so we can use this job for 2.6.x and 2.7 builds in parallel.<br/>

Workaround is to re-run the <a href=../push-latest-containers-to-quay_''' + JOB_BRANCH + '''>push-latest-containers-to-quay_2.6</a> job again for any containers that have the wrong :latest value, 
or use skopeo copy --all to explicitly copy from :2.6 to :latest. 
''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
        }

        throttleConcurrentBuilds {
            maxPerNode(2)
            maxTotal(10)
        }

        logRotator {
            daysToKeep(14)
            numToKeep(25)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        /* requires naginator plugin */
        /* publishers {
            retryBuild {
                rerunIfUnstable()
                retryLimit(1)
                progressiveDelay(30,90)
            }
        } */

        parameters{
            // TODO refactor to remove all refs to GIT_BRANCH
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
            stringParam("GIT_BRANCH", MIDSTM_BRANCH, "")
            stringParam("JOB_BRANCH", ""+JOB_BRANCH, "Normally we build from crw-2.y-rhel-8 jobs' tarballs, eg., job = crw-theia-sources_2.y")
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
            booleanParam("SCRATCH", true, "By default make a scratch build. Set to false to NOT do a scratch build.")
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        // TODO: enable naginator plugin to re-trigger if job fails

        // TODO: add email notification to nboldt@, anyone who submits a bad build, etc.

        // TODO: enable console log parser ?

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/get-sources-rhpkg-container-build_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}