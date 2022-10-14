import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = ["3.x"] // only one job
for (String JOB_BRANCH : JOB_BRANCHES) {
    DWO_VERSION="" + config.Other."DEV_WORKSPACE_OPERATOR_TAG"[JOB_BRANCH]
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        disabled(false)
        description('''
This job is used to copy the latest DWO bundle + its operands to 
<a href=https://quay.io/devworkspace/>https://quay.io/devworkspace/</a>.
        ''')
        
        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
            pipelineTriggers {
                triggers{
                    cron {
                        // Sat at 19:HH
                        spec("H 19 * * 6")
                    }
                }
            }
        
            disableResumeJobProperty()
            disableConcurrentBuildsJobProperty()
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(2)
        }

        parameters{
            stringParam("DWO_VERSION",DWO_VERSION,"version of DWO to use when searching for latest IIB or operator-bundle to copy to Quay.io")
            stringParam("EXTRA_FLAGS","",'''Pass additional flags to 
            <a href=https://github.com/redhat-developer/devspaces/blob/devspaces-3-rhel-8/product/copyDWOToQuay.sh>product/copyDWOToQuay.sh</a>
            such as --next, --latest, or -v (verbose)''')
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/DS_CI/Releng/push-latest-dwo-to-quay.jenkinsfile'))
            }
        }
    }
}
