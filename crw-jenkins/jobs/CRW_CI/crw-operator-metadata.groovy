// map branch to current/previous CSV versions 
def CSV_VERSIONS = [
    "2.6":["2.6.0","2.5.1"],
    "2.7":["2.7.0","2.6.0"],
    "2"  :["2.8.0","2.7.0"]
    ]
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
        UPSTM_NAME="che-operator"
        MIDSTM_NAME="operator-metadata"
        UPSTM_REPO="https://github.com/eclipse/" + UPSTM_NAME

        description('''
Artifact builder + sync job; triggers brew after syncing

<ul>
<li>Upstream: <a href=''' + UPSTM_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/redhat-developer/codeready-workspaces-''' + MIDSTM_NAME + '''/tree/''' + MIDSTM_BRANCH + '''/>operator</a></li>
<li>Downstream: <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>''' + MIDSTM_NAME + '''</a></li>
</ul>

<p>If <b style="color:green">downstream job fires</b>, see <a href=../get-sources-rhpkg-container-build/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>

<p>Note that there are two operator sync jobs:
<ul>
<li>   crw-operator_2.x</li>
<li>  crw-operator-metadata_2.x</li>
</ul>

<p> If this job is ever disabled and you want to update the LATEST_IMAGES files yourself, see 
<a href=https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh>https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            // poll SCM daily for changes in upstream
            pipelineTriggers {
                // [$class: "SCMTrigger", scmpoll_spec: "H H/2 * * *"]
                [$class: "SCMTrigger", scmpoll_spec: "@daily"]
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        parameters{
            stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            stringParam("JOB_BRANCH", JOB_BRANCH)
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