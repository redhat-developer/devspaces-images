def JOB_BRANCHES = ["2.8":"7.28.x", "2.9":"7.30.x", "2.x":"7.31.x"] // TODO switch 2.x to master, when 2.9 branches/jobs created
def JOB_DISABLED = ["2.8":true, "2.9":false, "2.x":true]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value // note: not used
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
Sync job between midstream repo https://github.com/redhat-developer/codeready-workspaces-images and pkgs.devel to provide sources for the plugin- and stack- images.

<p>Several builds triggered by this job depend on artifacts from 
<a href=../crw-deprecated_''' + JOB_BRANCH + '''/>crw-deprecated_''' + JOB_BRANCH + '''</a>

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