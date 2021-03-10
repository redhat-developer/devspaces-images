def JOB_BRANCHES = ["2.6":"7.24.x", "2.7":"7.26.x", "2.x":"master"]
def JOB_DISABLED = ["2.6":true, "2.7":false, "2.x":false]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value // note: not used
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
1. <a href=../crw-theia-sources_''' + JOB_BRANCH + '''>crw-theia-sources_''' + JOB_BRANCH + '''</a>: Build CRW Theia components needed for the Theia images (built in Brew), then <br/>
2. <a href=../crw-theia-containers_''' + JOB_BRANCH + '''>crw-theia-containers_''' + JOB_BRANCH + '''</a>: Trigger 3 Brew builds, then <br/>
3. <a href=../crw-theia-akamai_''' + JOB_BRANCH + '''>crw-theia-akamai_''' + JOB_BRANCH + '''</a>: Push Theia artifacts to akamai CDN <br/>

<p>If <b style="color:green">downstream job fires</b>, see <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>
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
            // TODO CRW-1644 remove JOB_BRANCH param once 2.7 is done (it can be computed from MIDSTM_BRANCH as of 2.8)
            stringParam("JOB_BRANCH", JOB_BRANCH)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            booleanParam("SCRATCH", false, '''If true, just do a scratch build.<br/>
If false, push to:<br/>
* quay.io/crw/theia-dev-rhel8,<br/>
* quay.io/crw/theia-rhel8, and<br/>
* quay.io/crw/theia-endpoint-rhel8''')
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