import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// for 2.yy, return 2.yy-1
def computePreviousVersion(String ver){
    verBits=ver.tokenize(".")
    int vb1=Integer.parseInt(verBits[1])
    if (vb1==0) {
        return verBits[0] + ".0"
    } else {
        return verBits[0] + "." + (vb1-1)
    }
}

def JOB_BRANCHES = [computePreviousVersion(config.Version+"")] // only one release at a time, previous stable one (2.yy-1)

for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        // keep job disabled until we explicitly need it
        disabled(true)

        MIDSTM_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"

        description('''
Collect product security manifests container builds, and push to <a href=https://github.com/redhat-developer/codeready-workspaces/tree/devspaces-3-rhel-8/product/manifest/>
https://github.com/redhat-developer/codeready-workspaces/tree/devspaces-3-rhel-8/product/manifest/</a>

as part of a GA release. 

<p>NOTE! Tags for the current release must exist first, but can be optionally created as part of this job.
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(5)
            artifactNumToKeep(2)
        }

        parameters{
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to use")
            booleanParam("TAG_RELEASE", false, "if true, tag the repos before collecting manifests")
            booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so if can be used for debugging.")
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/DS_CI/Releng/' + ITEM_NAME + '.jenkinsfile'))
            }
        }
    }
}
