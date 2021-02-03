// only sync to main branch 2, not sub-branches 2.6, 2.7
def JOB_BRANCHES = ["2"]
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        MIDSTM_BRANCH="crw-"+2+"-rhel-8"

        description('''
Sync CRW_CI jobs in gitlab repo to github.
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers {
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
            stringParam("GITLAB_BRANCH", "master", "branch of https://gitlab.cee.redhat.com/codeready-workspaces/crw-jenkins from which to sync")
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH,"branch of https://github.com/redhat-developer/codeready-workspaces-images to which to sync")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/' + ITEM_NAME + '.jenkinsfile'))
            }
        }
    }
}
