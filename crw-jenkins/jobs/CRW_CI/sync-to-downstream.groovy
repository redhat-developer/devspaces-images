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
                daysToKeep(45)
                numToKeep(90)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{
                // TODO: if we have to build CRW 2.14.1, this list needs to include plugin-* entries again
                textParam("REPOS", '''codeready-workspaces-stacks-cpp, 
codeready-workspaces-stacks-dotnet, 
codeready-workspaces-stacks-golang, 
codeready-workspaces-stacks-php,
codeready-workspaces-udi-openj9, 
codeready-workspaces-udi''', '''Comma separated list of repos to sync from github to pkgs.devel  
::
codeready-workspaces-stacks-cpp, 
codeready-workspaces-stacks-dotnet, 
codeready-workspaces-stacks-golang, 
codeready-workspaces-stacks-php,
codeready-workspaces-udi-openj9, 
codeready-workspaces-udi''')
                if (JB.equals("2.14")) {
                    stringParam("nodeVersion", "", "Leave blank if not needed")
                    stringParam("yarnVersion", "", "Leave blank if not needed")
                    stringParam("GOLANG_VERSION", config.Other.GOLANG_VERSION[JB], "for hub install")
                    stringParam("CSV_VERSION", "", "Leave blank to compute from job-config.json")
                }
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                // currently not used
                // stringParam("UPDATE_BASE_IMAGES_FLAGS", "", "Pass additional flags to updateBaseImages, eg., '--tag 1.13'")
                booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/sync-to-downstream_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}