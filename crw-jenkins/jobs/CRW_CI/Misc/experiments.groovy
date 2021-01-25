pipelineJob(ITEM_PATH){

    JOB_BRANCH=2.6
    MIDSTM_BRANCH="crw-"+JOB_BRANCH+"-rhel-8"

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

    /* requires naginator plugin */
    /* publishers {
        retryBuild {
            rerunIfUnstable()
            retryLimit(1)
            progressiveDelay(30,90)
        }
    } */

    parameters{
        stringParam("JOB_BRANCH", ""+JOB_BRANCH, "Normally we build from crw-2.y-rhel-8 jobs' tarballs, eg., job = crw-theia-sources_2.y")
        stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
    }

    // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
    authenticationToken('CI_BUILD')

    // TODO: enable naginator plugin to re-trigger if job fails

    // TODO: enable console log parser ?

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