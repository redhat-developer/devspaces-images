def JOB_BRANCHES = ["2.13"] // only one release at a time
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        // keep job disabled until we explicitly need it
        disabled(true)

        MIDSTM_BRANCH="crw-2-rhel-8"
        CSV_VERSION=JOB_BRANCH+".0"

        description('''
This job is meant to bootstrap a new release of CRW, by bumping versions in poms, registries, VERSION file, and committing changes.
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
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to update")
            stringParam("CSV_VERSION",CSV_VERSION,"version of CRW to use to update sources")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/update-version-and-registry-tags.jenkinsfile'))
            }
        }
    }
}
