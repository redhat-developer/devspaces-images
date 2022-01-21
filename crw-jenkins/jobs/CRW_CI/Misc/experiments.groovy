pipelineJob(ITEM_PATH){

    JOB_BRANCH="2.x"
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    disabled(true) // on reload of job, disable to avoid churn
    description('''Job for testing stuff out in bash or groovy''')

    properties {
        ownership {
            primaryOwnerId("nboldt")
        }

        disableResumeJobProperty()
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

    definition {
        // cpsScm {
        //     lightweight(true)
        //     scm { git ("https://github.com/redhat-developer/codeready-workspaces.git", "crw-2-rhel-8") } 
        //     scriptPath("product/check-rpm-signatures.Jenkinsfile")
        // }
        cps{
            sandbox(true)
            script(readFileFromWorkspace('jobs/CRW_CI/Misc/experiments.jenkinsfile'))
        }
    }
}