pipelineJob(ITEM_PATH){

    JOB_BRANCH="2.x"
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"

    description('''
Job for testing stuff out in bash or groovy
''')

    properties {
        ownership {
            primaryOwnerId("nboldt")
        }
    }

    throttleConcurrentBuilds {
        maxPerNode(1)
        maxTotal(1)
    }

    logRotator {
        daysToKeep(5)
        numToKeep(5)
        artifactDaysToKeep(2)
        artifactNumToKeep(1)
    }

    parameters{
        stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
    }

    // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
    authenticationToken('CI_BUILD')

    definition {
        // cpsScm {
        //     lightweight(true)
        //     scm { git ("https://github.com/redhat-developer/codeready-workspaces.git", "crw-2.6-rhel-8") } 
        //     scriptPath("product/check-rpm-signatures.Jenkinsfile")
        // }
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/CRW_CI/Misc/experiments.jenkinsfile'))
        }
    }
}