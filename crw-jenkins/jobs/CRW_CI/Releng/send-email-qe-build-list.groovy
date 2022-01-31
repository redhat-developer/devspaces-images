import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Management-Jobs"."send-email-qe-build-list"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/Releng/send-email-qe-build-list_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        CSV_VERSION=config.CSVs."operator-bundle"[JB].CSV_VERSION
        pipelineJob(jobPath){
            disabled(config."Management-Jobs"."send-email-qe-build-list"[JB].disabled) // on reload of job, disable to avoid churn 
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
                stringParam("mailSubject","CRW " + CSV_VERSION + ".tt-" + MMdd + " ready for QE",
'''email subject should be one of two formats: <br/>
* CRW ''' + CSV_VERSION + '''.ER-''' + MMdd + ''' ready for QE<br/>
* CRW ''' + CSV_VERSION + '''.RC-''' + MMdd + ''' ready for QE
''')
                stringParam("errataURL","https://errata.devel.redhat.com/advisory/"+config.Other.Errata[JB],
                    '''<a href=https://errata.devel.redhat.com/filter/2410>Find an Errata</a>''')
                stringParam("epicURL", "https://issues.redhat.com/browse/"+config.Other.Epic[JB],
                    '''<a href=https://issues.redhat.com/issues/?jql=project%20%3D%20CRW%20AND%20issuetype%20%3D%20Epic%20and%20text%20~%20%22overall%20epic%22%20order%20by%20key%20desc>Find an Epic</a>''')
                textParam("additionalNotes",'''(purpose of this build or respin goes here, if applicable)''',"Stuff to mention before the lists of images")
                booleanParam("doSendEmail",false,'''if checked, send mail; else display email contents in Jenkins console, but do not send''')
                // TODO remove this if check once 2.15 is live
                if (!JB.equals("2.14")) {
                    booleanParam("doDisableJobs",false,'''if checked, disable the _''' + JOB_BRANCH + ''' jobs for this release to avoid respins''')
                }
                // # RECIPIENTS - comma and space separated list of recipient email addresses
                stringParam("RECIPIENTS","codeready-workspaces-qa@redhat.com, che-prod@redhat.com",'''send mail to recipient(s) listed (comma and space separated)''')
                stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to use")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/Releng/send-email-qe-build-list_' + JOB_BRANCH + '.jenkinsfile'))
                }
            }
        }
    }
}
