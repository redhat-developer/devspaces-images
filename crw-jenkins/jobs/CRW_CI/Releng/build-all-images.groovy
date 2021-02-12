def JOB_BRANCHES = ["2.7":""] // , "2":""] // TODO enable this for 2.x once we know it works for 2.7; 2.8 version will have more images (devworkspace)
def JOB_DISABLED = ["2.7":false, "2":true]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=JB.key
    MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    if (JOB_BRANCH.equals("2")) { jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH + ".x" }
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
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(2)
        }

        parameters{
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH)
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
