// map branch to current/previous CSV versions + OLM channel (nightly or stable)
def CSV_VERSIONS = [
    "2.7":["2.7.1","2.7.0"],
    "2.8"  :["2.8.0","2.7.1"],
    "2.x"  :["2.9.0","2.8.0"]
    ]
def JOB_BRANCHES = ["2.7":"7.26.x", "2.8":"7.28.x", "2.x":"7.30.x"] // TODO switch 2.x to main, when 2.9 branches/jobs created
def JOB_DISABLED = ["2.7":true, "2.8":true, "2.x":false]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        UPSTM_NAME="che-operator"
        MIDSTM_NAME="operator-metadata"
        UPSTM_REPO="https://github.com/eclipse/" + UPSTM_NAME

        description('''
Syncs/generates code from upstream into midstream, then triggers sync, Brew build, and copy to quay jobs

<p>There are two operator-related sync jobs:<br/>
1. <a href=../crw-operator_''' + JOB_BRANCH + '''>crw-operator_''' + JOB_BRANCH + '''</a>: go code<br/>
2. <a href=../crw-operator-metadata_''' + JOB_BRANCH + '''>crw-operator-metadata_''' + JOB_BRANCH + '''</a>: CRD, CSV</p>

<ul>
<li>Upstream: <a href=''' + UPSTM_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Midstream 1 (transformation code): 
<a href=https://github.com/redhat-developer/codeready-workspaces-operator/tree/''' + MIDSTM_BRANCH + '''/>crw-operator</a></li>
<li>Midstream 2 (transformed code): <a href=https://github.com/redhat-developer/codeready-workspaces-images/tree/''' + MIDSTM_BRANCH + '''/codeready-workspaces-''' + MIDSTM_NAME + '''/>crw-''' + MIDSTM_NAME + '''</a></li>
<li>Downstream (copied from midstream 2): <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>crw-''' + MIDSTM_NAME + '''</a></li>
</ul>

<p>If <b style="color:green">downstream job fires</b>, see 
<ol>
<li><a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream</a>, then</li>
<li><a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>, then</li>
<li><a href=../push-latest-container-to-quay_''' + JOB_BRANCH + '''/>push to quay</a></li>
</ol>
<br/>
If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>

<p> If this job is ever disabled and you want to update the LATEST_IMAGES files yourself, see 
<a href=https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh>https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers{
                    pollSCM{
                        scmpoll_spec("H H/2 * * *") // every 2hrs
                    }
                }
            }

            disableResumeJobProperty()
        }

        // limit builds to 1 every 20 min
        quietPeriod(1200) // in sec

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        parameters{
            stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            stringParam("CSV_VERSION", CSV_VERSIONS[JB.key][0])
            stringParam("CSV_VERSION_PREV", CSV_VERSIONS[JB.key][1])
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/crw-operator-metadata_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}