import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Jobs"."theia-akamai".keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/crw-theia-akamai_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config."Jobs"."theia-akamai"[JB].disabled) // on reload of job, disable to avoid churn
            description('''
1. <a href=../crw-theia-sources_''' + JOB_BRANCH + '''>crw-theia-sources_''' + JOB_BRANCH + '''</a>: Bootstrap CRW Theia components by building temporary containers and pushing them to quay, then trigger <a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream_''' + JOB_BRANCH + '''</a> and <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>.<br/>
2. <a href=../crw-theia-akamai_''' + JOB_BRANCH + '''>crw-theia-akamai_''' + JOB_BRANCH + '''</a>: Push Theia artifacts to akamai CDN <br/>
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                disableResumeJobProperty()
                disableConcurrentBuildsJobProperty()
                quietPeriod(30) // no more than one build every 30s
            }

            logRotator {
                daysToKeep(5)
                numToKeep(5)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/crw-theia-akamai_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}