def JOB_BRANCHES = ["2.7"] // , "2.8"]
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"

        description('''
This job is meant to be run before code freeze and when adding new containers to the BOM for CRW, in order to make sure we don't have
unsigned content going into an Errata.
<p>
  See <a href=https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/product/check-rpm-signatures.sh>
https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/product/check-rpm-signatures.sh</a>
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
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to use as source of the new branches")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/check-rpm-signatures.jenkinsfile'))
            }
        }
    }
}

