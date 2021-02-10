def JOB_BRANCHES = ["2.6":"7.24.x", "2.7":"7.25.x", "2":"master"] // TODO switch to 7.26.x
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value // note: not used
    JOB_BRANCH=JB.key
    MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    if (JOB_BRANCH.equals("2")) { jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH + ".x" }
    pipelineJob(jobPath){
        description('''
Sync job between midstream repo https://github.com/redhat-developer/codeready-workspaces-images and pkgs.devel to provide sources for the plugin- and stack- images.

<p>Several builds triggered by this job depend on artifacts from 
<a href=../crw-deprecated_''' + JOB_BRANCH + '''/>crw-deprecated_''' + JOB_BRANCH + '''</a>

<p>Once sync is done, track Brew builds from <a href=../get-sources-rhpkg-container-build/>get-sources-rhpkg-container-build</a>.

<p>TODO: tie this into overall orchestration job, see <a href=https://issues.redhat.com/browse/CRW-668>CRW-668</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            // poll SCM every 2 hrs for changes in upstream
            pipelineTriggers {
                [$class: "SCMTrigger", scmpoll_spec: "H H/2 * * *"]
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
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
            stringParam("JOB_BRANCH", JOB_BRANCH)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            booleanParam("SCRATCH", false, "If true, just do a scratch build. If false, push to quay.io/crw")
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/crw-plugins-and-stacks_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}