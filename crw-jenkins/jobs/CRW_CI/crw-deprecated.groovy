///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// /////
///// THIS FILE IS DEPRECATED and should be removed for 2.14
///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// /////

import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Jobs".deprecated.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/crw-deprecated_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        UPSTM_NAME="codeready-workspaces-deprecated"
        SOURCE_REPO="redhat-developer/" + UPSTM_NAME
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config."Jobs".deprecated[JB].disabled) // on reload of job, disable to avoid churn
            description('''
Lang server dependency builder
<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''/tree/''' + MIDSTM_BRANCH + '''/>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/redhat-developer/codeready-workspaces-images/tree/''' + MIDSTM_BRANCH + '''>codeready-workspaces-images</a> (used by various container builds, including plugin sidecars and stacks)</li>
</ul>

<p>When done, downstream builds can be triggered using these artifacts using 
<a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream_''' + JOB_BRANCH + '''</a>
<p>Results:
    <ul>
        <li><a href=https://github.com/redhat-developer/codeready-workspaces-images/releases?q=%22assets+for+the+'''+
(config.CSVs."operator-bundle"[JB].CSV_VERSION)+
'''+deprecated+release%22&expanded=true>redhat-developer/codeready-workspaces-images/releases</a></li>
    </ul>
</p>
            ''')

            properties {

                ownership {
                    primaryOwnerId("nboldt")
                }

                githubProjectUrl("https://github.com/" + SOURCE_REPO)

                // disabled because no changes in the branch / run this manually 
                // pipelineTriggers {
                //     triggers{
                //         pollSCM{
                //             scmpoll_spec("H H * * *") // every 24hrs
                //         }
                //     }
                // }

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
                stringParam("GOLANG_VERSION", config.Other.GOLANG_VERSION[JB], "for hub install")
                booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/crw-deprecated_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}