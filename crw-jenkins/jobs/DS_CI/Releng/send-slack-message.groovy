import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Management-Jobs"."slack-notification"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/Releng/send-slack-message_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        CSV_VERSION=config.CSVs."operator-bundle"[JB].CSV_VERSION
        OCP_VERSIONS="" + config.Other."OPENSHIFT_VERSIONS_SUPPORTED"[JB]?.join(" ")
        pipelineJob(jobPath){
            disabled(config."Management-Jobs"."slack-notification"[JB].disabled) // on reload of job, disable to avoid churn 
            description('''
Send slack message to <a href="https://app.slack.com/client/E030G10V24F/C04U0J12FC7">#devspaces-ci</a> announcing an ER or RC build, including a list of images. 
This job will also trigger <a href=../../push-latest-containers-to-quay_'''+JB+'''>push-latest-containers-to-quay</a> and <a href=../../update-digests_'''+JB+'''>update-digests</a>
to refresh quay images. 
            ''')

            properties {
                ownership {
                    primaryOwnerId("sdawley")
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
                stringParam("OCP_VERSIONS", OCP_VERSIONS, '''Space-separated list of OCP versions supported by this release''')
                stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/devspaces branch to use")
                stringParam("errataURL",(config.Other.Errata[JB].equals("n/a")?"":"https://errata.devel.redhat.com/advisory/"+config.Other.Errata[JB]),
                    '''<a href=https://errata.devel.redhat.com/filter/2410>Find an Errata</a>''')
                stringParam("epicURL", (config.Other.Epic[JB].equals("n/a")?"":"https://issues.redhat.com/browse/"+config.Other.Epic[JB]),
                    '''<a href=https://issues.redhat.com/issues/?jql=project%20%3D%20CRW%20AND%20issuetype%20%3D%20Epic%20and%20text%20~%20%22overall%20epic%22%20order%20by%20key%20desc>Find an Epic</a>''')
            }
            
            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/Releng/send-slack-message_' + JOB_BRANCH + '.jenkinsfile'))
                }
            }
        }
    }
}
