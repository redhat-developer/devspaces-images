///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// 
///// THIS FILE IS DEPRECATED and not used; for 2.9+, just use crw-theia-sources
///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// 

def JOB_BRANCHES = ["2.8":"7.28.x", "2.9":"7.30.x", "2.x":"7.32.x"] // TODO switch 2.x to master, when 2.10 branches/jobs created
def JOB_DISABLED = ["2.8":true, "2.9":true, "2.x":true]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value // note: not used
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
1. <a href=../crw-theia-sources_''' + JOB_BRANCH + '''>crw-theia-sources_''' + JOB_BRANCH + '''</a>: Bootstrap CRW Theia components by building temporary containers and pushing them to quay<br/>
2. <a href=../crw-theia-containers_''' + JOB_BRANCH + '''>crw-theia-containers_''' + JOB_BRANCH + '''</a>: fetch temporary containers, extract assets, and run Brew builds, then <br/>
3. <a href=../crw-theia-akamai_''' + JOB_BRANCH + '''>crw-theia-akamai_''' + JOB_BRANCH + '''</a>: Push Theia artifacts to akamai CDN <br/>

<p>If <b style="color:green">downstream job fires</b>, see <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>

<p>
Results:
<ul>
<li><a href=https://quay.io/crw/theia-dev-rhel8>quay.io/crw/theia-dev-rhel8</a></li>
<li><a href=https://quay.io/crw/theia-rhel8>quay.io/crw/theia-rhel8</a></li>
<li><a href=https://quay.io/crw/theia-endpoint-rhel8>quay.io/crw/theia-endpoint-rhel8</a></li>
</ul>
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
            numToKeep(10)
            artifactDaysToKeep(1)
            artifactNumToKeep(1)
        }

        throttleConcurrentBuilds {
            maxPerNode(2)
            maxTotal(10)
        }

        parameters{
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
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