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
                    spec ('0 23 * * 4') // every week on Thurs "night"
                }
            }
        }

        disableResumeJobProperty()
    }

    throttleConcurrentBuilds {
        maxPerNode(1)
        maxTotal(1)
    }

    quietPeriod(86400) // limit builds to 1 every 24 hrs (in sec)

    logRotator {
        daysToKeep(5)
        numToKeep(5)
        artifactDaysToKeep(5)
        artifactNumToKeep(5)
    }

    parameters{
        booleanParam("DRY_RUN", false, "check box for dry run only (no issues will be created)")
        stringParam("NUM_WEEKS", "2", "look at issues closed in last n weeks; default 2")
        booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
    }

    definition {
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/CRW_CI/Releng/ghira.jenkinsfile'))
        }
    }
}
