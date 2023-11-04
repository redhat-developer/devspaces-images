import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = ["3.x"] // only one job
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/Releng/copyIIBsToQuay.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        DS_VERSION=config.Version+""
        OCP_VERSIONS="" + config.Other."OPENSHIFT_VERSIONS_SUPPORTED"[JB]?.join(" ")
        pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
            disabled(false)
            description('''
Copy latest filtered IIBs to <a href=https://quay.io/devspaces/iib>https://quay.io/devspaces/iib</a>''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                disableResumeJobProperty()
            }

            throttleConcurrentBuilds {
                maxPerNode(2)
                maxTotal(10)
            }

            quietPeriod(120) // limit builds to 1 every 2 mins (in sec)

            logRotator {
                daysToKeep(45)
                numToKeep(90)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{ 
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "Branch of sources to use for scripts")
                stringParam("DS_VERSION", DS_VERSION, "Version of DS to use when copying IIBs to Quay")
                stringParam("OCP_VERSIONS", OCP_VERSIONS, '''Space-separated list of OCP versions supported by this release''')
                booleanParam("FORCE_BUILD", false, "If true and target image exists, will re-filter and re-push it; if false, avoid updating image timestamps")
            }

            // TODO: add email notification to nboldt@, anyone who submits a bad build, etc.

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/Releng/copyIIBsToQuay.jenkinsfile'))
                }
            }
        }
    }
}