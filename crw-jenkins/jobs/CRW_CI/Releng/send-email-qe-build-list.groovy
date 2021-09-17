def JOB_BRANCHES = ["2.12":"", "2.x":""] // no upstream branches
def JOB_DISABLED = ["2.12":true, "2.x":true]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
Send an email to QE announcing an ER or RC build, including a list of images.
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
        }

        throttleConcurrentBuilds {
            maxPerNode(1)
            maxTotal(1)
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(2)
        }

        parameters{
            MMdd = ""+(new java.text.SimpleDateFormat("MM-dd")).format(new Date())
            stringParam("mailSubject","CRW " + JOB_BRANCH + ".0.tt-" + MMdd + " ready for QE",
'''email subject should be one of two formats: <br/>
* CRW ''' + JOB_BRANCH + '''.0.ER-''' + MMdd + ''' ready for QE<br/>
* CRW ''' + JOB_BRANCH + '''.0.RC-''' + MMdd + ''' ready for QE
''')
            stringParam("errataURL","https://errata.devel.redhat.com/advisory/81387",'')
            stringParam("epicURL", "https://issues.redhat.com/browse/CRW-2102")
            textParam("additionalNotes",'''(purpose of this build or respin goes here, if applicable)''',"Stuff to mention before the lists of images")
            booleanParam("doSendEmail",false,'''if checked, send mail; else display email contents in Jenkins console, but do not send''')
            booleanParam("doOSBS",false,'''if checked, include OSBS images in email''')
            // # RECIPIENTS - comma and space separated list of recipient email addresses
            stringParam("RECIPIENTS","codeready-workspaces-qa@redhat.com, che-prod@redhat.com",'''send mail to recipient(s) listed (comma and space separated)''')
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to use")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/send-email-qe-build-list_' + JOB_BRANCH + '.jenkinsfile'))
            }
        }
    }
}
