def JOB_BRANCHES = [ "2.x" : "" ] 
def JOB_DISABLED = ["2.x":false]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
Sync CRW_CI jobs in gitlab repo to github.
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers{
                    cron {
                        spec ('H H/12 * * *') // every 12 hrs
                    }
                }
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(5)
            artifactNumToKeep(2)
        }


        throttleConcurrentBuilds {
            maxPerNode(1)
            maxTotal(1)
        }

        parameters{
            // gitlab repo uses master: do not change. Only sync to main branch crw-2, not the 2.y sub-branches
            stringParam("GITLAB_BRANCH", "master", "branch of https://gitlab.cee.redhat.com/codeready-workspaces/crw-jenkins from which to sync")
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH,"branch of https://github.com/redhat-developer/codeready-workspaces-images to which to sync")
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/sync-jenkins-gitlab-to-github.jenkinsfile'))
            }
        }
    }
}
