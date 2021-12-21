import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Management-Jobs"."sync-to-downstream"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/sync-to-downstream_'+JB+'.jenkinsfile')
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
            disabled(config."Management-Jobs"."sync-to-downstream"[JB].disabled) // on reload of job, disable to avoid churn
            description('''
Sync job between midstream repo https://github.com/redhat-developer/codeready-workspaces-images and pkgs.devel to provide sources for the plugin- and stack- images.

<p>Once sync is done, track Brew builds from <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>.
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }
            }

            logRotator {
                daysToKeep(15)
                numToKeep(40)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{
                // remove codeready-workspaces-plugin-intellij as it can't currently be built this way
                textParam("REPOS", '''codeready-workspaces-plugin-java11-openj9, 
codeready-workspaces-plugin-java11, 
codeready-workspaces-plugin-java8-openj9, 
codeready-workspaces-plugin-java8, 
codeready-workspaces-plugin-kubernetes, 
codeready-workspaces-plugin-openshift, 
codeready-workspaces-stacks-cpp, 
codeready-workspaces-stacks-dotnet, 
codeready-workspaces-stacks-golang, 
codeready-workspaces-stacks-php''', '''Comma separated list of repos to sync from github to pkgs.devel  
::
codeready-workspaces-plugin-java11-openj9, 
codeready-workspaces-plugin-java11,  
codeready-workspaces-plugin-java8-openj9, 
codeready-workspaces-plugin-java8, 
codeready-workspaces-plugin-kubernetes, 
codeready-workspaces-plugin-openshift, 
codeready-workspaces-stacks-cpp, 
codeready-workspaces-stacks-dotnet, 
codeready-workspaces-stacks-golang, 
codeready-workspaces-stacks-php''')
                stringParam("UPDATE_BASE_IMAGES_FLAGS", "", "Pass additional flags to updateBaseImages, eg., '--tag 1.13'")
                stringParam("OPENSHIFT_CONTENT_SET_VERSION", config.Other.OPENSHIFT_CONTENT_SET_VERSION[JB])
                stringParam("nodeVersion", "", "Leave blank if not needed")
                stringParam("yarnVersion", "", "Leave blank if not needed")
                stringParam("CSV_VERSION", "", "Leave blank to compute from job-config.json")
                stringParam("GOLANG_VERSION", config.Other.GOLANG_VERSION[JB], "for hub install")
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/sync-to-downstream_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}