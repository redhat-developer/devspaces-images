def JOB_BRANCHES = ["2.12":"","2.x":""] // no upstream branches
def JOB_DISABLED = ["2.12":true,"2.x":false] // special case - only run the 2.x job every week
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        // keep job disabled until we explicitly need it
        disabled(JOB_DISABLED[JB.key]) 

        description('''
This job is meant to be used to orchestrate rebuilding everything in CRW after a major branch update (7.yy.x -> 7.zz.x) or for global CVE updates.
<p>Do not abuse this job!
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers{
                    cron {
                        spec ('H 23 * * 5') // every Friday night at 23:HH
                    }
                }
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(2)
        }

        parameters{
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH)
            stringParam("PHASES", "1 2 3 4 5", '''
Phases:
<ol>
    <li> build lang server dependencies (5 tarballs)</li>
    <li> build plugin and stack sidecar images (6 plugin, 4 stack sidecar images)</li>
    <li> build theia images (3 images)</li>
    <li> build internals (14-15 images): 
        <ul>
            <li> backup (@since 2.12), configbump, operator, dashboard, devfileregistry, </li>
            <li> idea, imagepuller, jwtproxy, machineexec, pluginbroker-artifacts, </li>
            <li> pluginbroker-metadata, pluginregistry, server, traefik,</li>
            <li> devworkspace-controller (TODO: @removed 2.12), devworkspace (TODO: @removed 2.12) </li> 
        </ul>
    </li>
    <li> build metadata image + iib</li>
</ol>
            ''')
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/build-all-images_' + JOB_BRANCH + '.jenkinsfile'))
            }
        }
    }
}
