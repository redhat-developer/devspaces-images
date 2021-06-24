def GOLANG_VERSIONS = [
    "2.8": "1.15.3",
    "2.9": "1.15.3",
    "2.x": "1.15.3"
    // "2.x": "1.16.2" // if in future we use traefik from master, we need golang 1.16
    ]
def JOB_BRANCHES = ["2.8":"v2.3.2", "2.9":"v2.3.2", "2.x":"v2.3.2"] // in future, could switch to use "2.x":"master"] 
def JOB_DISABLED = ["2.8":true, "2.9":true, "2.x":false]
for (JB in JOB_BRANCHES) {
    SOURCE_TAG=JB.value
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        UPSTM_NAME="traefik"
        MIDSTM_NAME="traefik"
        SOURCE_REPO="traefik/" + UPSTM_NAME

        description('''
Artifact builder + sync job; triggers brew after syncing

<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/redhat-developer/codeready-workspaces/tree/''' + MIDSTM_BRANCH + '''/dependencies/>dependencies</a></li>
<li>Downstream: <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>''' + MIDSTM_NAME + '''</a></li>
</ul>

<p>If <b style="color:green">downstream job fires</b>, see <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            githubProjectUrl("https://github.com/" + SOURCE_REPO)

            // disabled because no changes in the branch / run this manually 
            // pipelineTriggers {
            //     triggers{
            //         pollSCM{
            //             scmpoll_spec("H H/24 * * *") // every 24hrs
            //         }
            //     }
            // }

            disableResumeJobProperty()
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        parameters{
            stringParam("SOURCE_TAG", SOURCE_TAG, "Fetch branch, then build from tag (if set)")
            stringParam("GOLANG_VERSION", GOLANG_VERSIONS.containsKey(JB.key) ? GOLANG_VERSIONS[JB.key] : "1.15.3", "for 2.y, use 1.15.3 (traefik from v2.3.2)")
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/crw-traefik_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}