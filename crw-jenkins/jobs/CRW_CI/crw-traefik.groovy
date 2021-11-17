import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config.Jobs.traefik.keySet()
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        if (JOB_BRANCH.equals("2.13")) {
            fileCheck = readFileFromWorkspace('jobs/CRW_CI/crw-traefik_'+JB+'.jenkinsfile')
        } else {
            fileCheck = readFileFromWorkspace('jobs/CRW_CI/template_'+JB+'.jenkinsfile')
        }
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config.Jobs.traefik[JB].disabled) // on reload of job, disable to avoid churn
            UPSTM_NAME="traefik"
            MIDSTM_NAME="traefik"
            SOURCE_REPO="traefik/" + UPSTM_NAME
            MIDSTM_REPO="redhat-developer/codeready-workspaces-images"

            //No check since traefik uses a tag instead of a branch
            SOURCE_BRANCH="master"
            SOURCE_TAG=""+config.Jobs.traefik[JB].upstream_branch[0]

            description('''
Artifact builder + sync job; triggers brew after syncing

<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/redhat-developer/codeready-workspaces/tree/''' + MIDSTM_BRANCH + '''/dependencies/>dependencies</a></li>
<li>Downstream: <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>''' + MIDSTM_NAME + '''</a></li>
</ul>

<p>If <b style="color:green">downstream job fires</b>, see 
<a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream</a>, then
<a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>
<p>Results:
    <ul>
        <li><a href=https://github.com/redhat-developer/codeready-workspaces-images/releases?q=%22assets+for+the+'''+
(config.CSVs."operator-bundle"[JB].CSV_VERSION)+
'''+'''+MIDSTM_NAME+'''+release%22&expanded=true>redhat-developer/codeready-workspaces-images/releases</a></li>
        <li><a href=https://quay.io/crw/'''+MIDSTM_NAME+'''-rhel8>quay.io/crw/'''+MIDSTM_NAME+'''-rhel8</a></li>
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
            }

            logRotator {
                daysToKeep(5)
                numToKeep(5)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{
                stringParam("SOURCE_REPO", SOURCE_REPO)
                stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
                stringParam("SOURCE_TAG", SOURCE_TAG, "Fetch branch, then build from tag (if set)")
                stringParam("MIDSTM_REPO", MIDSTM_REPO)
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                stringParam("MIDSTM_NAME", MIDSTM_NAME)
                stringParam("GOLANG_VERSION", config.Other.GOLANG_VERSION[JB], "for 2.y, use 1.16.2 (traefik from v2.5.0)")
                booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    if (JOB_BRANCH.equals("2.13")) {
                        script(readFileFromWorkspace('jobs/CRW_CI/crw-traefik_'+JOB_BRANCH+'.jenkinsfile'))
                    } else {
                        script(readFileFromWorkspace('jobs/CRW_CI/template_'+JOB_BRANCH+'.jenkinsfile'))
                    }
                }
            }
        }
    }
}