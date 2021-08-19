def JOB_BRANCHES = ["2.11":"","2.x":""] // no upstream branches
def JOB_DISABLED = ["2.11":false,"2.x":false] // special case - only run the 2.x job every week
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
            stringParam("PHASES", "1 2 3 4 5", '''Phases:<br/>
1 - build lang server dependencies (5 tarballs)<br/>
2 - build plugin and stack sidecar images (6 plugin, 4 stack sidecar images)<br/>
3 - build theia images (3 images)<br/>
4 - build internals (14-15 images)<br/>
 * backup, configbump, operator, dashboard, devfileregistry, <br/>
 * idea, imagepuller, jwtproxy, machineexec, pluginbroker-artifacts, <br/>
 * pluginbroker-metadata, pluginregistry, server, traefik,<br/>
 * devworkspace-controller, devworkspace (TODO: remove in 2.12+), 
5 - build metadata (3 images + iib)
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
