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
        stringParam("NUM_DAYS", "14", "look at issues closed in last n days; default 14")
        stringParam("LIMIT", "0", "if 0, process all issues in the last NUM_DAYS days; if >0, only process the first LIMIT issues")
        booleanParam("DRY_RUN", false, "check box for dry run only (no issues will be created or updated)")
        booleanParam("DEBUG", false, "check box for more console output")
    }

    definition {
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/DS_CI/Releng/ghira.jenkinsfile'))
        }
    }
}
