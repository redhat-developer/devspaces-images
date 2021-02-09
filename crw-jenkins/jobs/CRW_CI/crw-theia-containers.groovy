def JOB_BRANCHES = ["2.6"] // , "2.7"]
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}_${JOB_BRANCH}"){
        MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"

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
            numToKeep(10)
            artifactDaysToKeep(1)
            artifactNumToKeep(1)
        }

        throttleConcurrentBuilds {
            maxPerNode(2)
            maxTotal(10)
        }

        parameters{
            stringParam("JOB_BRANCH", JOB_BRANCH)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            booleanParam("SCRATCH", false, "If true, just do a scratch build.\n\
If false, push to:\n\
* quay.io/crw/theia-dev-rhel8, \n\
* quay.io/crw/theia-rhel8, and \n\
* quay.io/crw/theia-endpoint-rhel8")
            stringParam("PLATFORMS", "x86_64, s390x, ppc64le")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/crw-theia-containers_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}