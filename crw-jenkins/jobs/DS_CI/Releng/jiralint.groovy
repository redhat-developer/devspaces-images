pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
    disabled(false)
    description('''Generate daily lint reports of jira issues''')

    properties {
        ownership {
            primaryOwnerId("nboldt")
        }

        pipelineTriggers {
            triggers {
                cron {
                    spec ('0 22 * * 0-4') // every night @ 22h00, Sun-Thu [1 weekly run Sun; 4 daily runs Mon - Thu]
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
        booleanParam("DRY_RUN", false, "check box for dry run only (no issues will be created or updated)")
        booleanParam("DEBUG", false, "check box for more console output")
        stringParam("LIMIT", "200", "default: 200 results returned from JIRA queries")
        stringParam("TO_EMAIL", "", "to override sending mail to component owners, enter your email address here")
    }

    definition {
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/DS_CI/Releng/jiralint.jenkinsfile'))
        }
    }
}
