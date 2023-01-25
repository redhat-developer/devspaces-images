pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
    disabled(false)
    description('''<p>Generate daily lint reports of <a href=https://issues.redhat.com/browse/CRW>CRW jira</a> hygiene</p>
<ul>
<li>a <a href=https://github.com/redhat-developer/devspaces-jiralint/blob/devspaces-3-rhel-8/reports-weekly.json>weekly report</a> Sundays @ 22h00 and </li>
<li><a href=https://github.com/redhat-developer/devspaces-jiralint/blob/devspaces-3-rhel-8/reports-daily.json>daily reports</a> Monday to Thursday @ 22h00</li>
</ul><br/>
To override the normal report type to today, choose a different type. <br/>
Use <b>dry run</b> flag and your own email address to control output before sending emails to component owners.''')

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
        booleanParam("DRY_RUN", false, "Check box for dry run only - no emails will be sent")
        booleanParam("DEBUG", false, "Check box for more console output")
        stringParam("LIMIT", "200", "Default: 200 results returned from JIRA queries")
        stringParam("TO_EMAIL", "", "To override sending mail to component owners, enter your email address here")
        choiceParam("WHICH_REPORT", ['default','daily','weekly'], "Choose daily or weekly to create that report")
    }

    definition {
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/DS_CI/Releng/jiralint.jenkinsfile'))
        }
    }
}
