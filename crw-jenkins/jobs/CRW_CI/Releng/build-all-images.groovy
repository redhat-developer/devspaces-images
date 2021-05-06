def JOB_BRANCHES = ["2.8":"", "2.x":""]
def JOB_DISABLED = ["2.8":true, "2.x":false]
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
            stringParam("PHASES", "1 2 3 4 5 6", '''Phases:<br/>
1 - build image puller (and sleep executables)<br/>
2 - build lang server dependencies (7 builds -> tarballs)<br/>
3 - build plugin and stack sidecar images (6 plugin, 4 stack sidecar images)<br/>
4 - build theia assets and images (tarballs + 3 images)<br/>
5 - build server, operator and internals (tarballs + 8 images)<br/>
6 - build registries and metadata (tarballs + 3 images + iib)
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
