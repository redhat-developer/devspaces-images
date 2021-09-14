def JOB_BRANCHES = ["2.11":"", "2.x":""] // no upstream branches
def JOB_DISABLED = ["2.11":true, "2.x":false]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
This job will cause the operator-metadata container to rebuild in both Brew and Quay
if any new images are found in <a href=https://quay.io/crw/>quay.io/crw/</a> using 
<a href=https://github.com/redhat-developer/codeready-workspaces/blob/crw-2-rhel-8/product/getLatestImageTags.sh>
./getLatestTags.sh --quay --hide</a>.
<p>
  Results:
  <ul>
    <li><a href=https://quay.io/repository/crw/crw-2-rhel8-operator-metadata?tag=latest&tab=tags>quay.io/crw/crw-2-rhel8-operator-metadata</a></li>
</ul>

<p> If this job is ever disabled and you want to update the LATEST_IMAGES files yourself, see 
  <a href=https://github.com/redhat-developer/codeready-workspaces/blob/crw-''' + JOB_BRANCH + '''-rhel-8/dependencies/LATEST_IMAGES.sh>LATEST_IMAGES.sh --commit</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers {
                    cron {
                        spec ('H H/4 * * *') // every 4 hrs
                    }
                }
            }

            disableResumeJobProperty()
        }

        throttleConcurrentBuilds {
            maxPerNode(1)
            maxTotal(1)
        }

        // limit builds to 1 every 2 hrs
        quietPeriod(7200) // in sec

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(5)
            artifactNumToKeep(5)
        }

        parameters{
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                if (JOB_BRANCH.equals("2.10")) {
                    script(readFileFromWorkspace('jobs/CRW_CI/update-digests-in-registries-and-metadata_'+JOB_BRANCH+'.jenkinsfile'))
                } else {
                    script(readFileFromWorkspace('jobs/CRW_CI/update-digests-in-metadata_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}