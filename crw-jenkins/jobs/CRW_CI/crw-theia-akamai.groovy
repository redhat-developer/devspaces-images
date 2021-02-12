def JOB_BRANCHES = ["2.6":"7.24.x", "2.7":"7.26.x", "2":"master"]
def JOB_DISABLED = ["2.6":true, "2.7":false, "2":true]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value // note: not used
    JOB_BRANCH=JB.key
    MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    if (JOB_BRANCH.equals("2")) { jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH + ".x" }
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
1. <a href=../crw-theia-sources_''' + JOB_BRANCH + '''>crw-theia-sources_''' + JOB_BRANCH + '''</a>: Build CRW Theia components needed for the Theia images (built in Brew), then <br/>
2. <a href=../crw-theia-containers_''' + JOB_BRANCH + '''>crw-theia-containers_''' + JOB_BRANCH + '''</a>: Trigger 3 Brew builds, then <br/>
3. <a href=../crw-theia-akamai_''' + JOB_BRANCH + '''>crw-theia-akamai_''' + JOB_BRANCH + '''</a>: Push Theia artifacts to akamai CDN <br/>
        ''')

        properties {
            disableConcurrentBuilds()
            // quietPeriod(30) // no more than one build every 30s

            ownership {
                primaryOwnerId("nboldt")
            }
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