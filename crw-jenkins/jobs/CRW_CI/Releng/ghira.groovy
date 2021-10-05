pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
    disabled(false)
    description('''Sync job between github issues and jira for docs team''')

    properties {
        ownership {
            primaryOwnerId("nboldt")
        }

        pipelineTriggers {
            triggers {
                cron {
                    spec ('0 23 * * 2') // every week on Tuesday "night"
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
        booleanParam("DRY_RUN", false, "default true; check box to not do anything, just output log")
    }

    // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
    authenticationToken('CI_BUILD')

    definition {
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/CRW_CI/Releng/ghira.jenkinsfile'))
        }
    }
}
