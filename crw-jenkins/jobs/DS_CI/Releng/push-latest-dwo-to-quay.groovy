import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

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
<ul>
    <li><a href=https://quay.io/repository/devworkspace/devworkspace-project-clone-rhel8?tab=tags>devworkspace-project-clone-rhel8</a></li>
    <li><a href=https://quay.io/repository/devworkspace/devworkspace-rhel8-operator?tab=tags>devworkspace-rhel8-operator</a></li>
    <li><a href=https://quay.io/repository/devworkspace/devworkspace-operator-bundle?tab=tags>devworkspace-operator-bundle</a></li>
</ul>
''')
        
        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
            pipelineTriggers {
                triggers{
                    cron {
                        // Every day at 19:HH
                        spec("H 19 * * *")
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
            stringParam("EXTRA_FLAGS","-v --next",'''Pass additional flags to 
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
