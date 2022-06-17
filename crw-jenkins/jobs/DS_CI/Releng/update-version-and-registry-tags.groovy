import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// for 2.yy, return 2.yy+1
def computeNextVersion(String ver){
    verBits=ver.tokenize(".")
    int vb1=Integer.parseInt(verBits[1])
    return verBits[0] + "." + (vb1+1)
}

def JOB_BRANCHES = [computeNextVersion(config.Version+"")] // only one release at a time, latest 2.yy+1
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        // keep job disabled until we explicitly need it
        disabled(true)

        description('''
This job is meant to bootstrap a new release of DS, by bumping versions in 
job-config.json, VERSION file and registries, then committing changes.
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
            stringParam("DS_VERSION",JOB_BRANCH,"future version of DS to use when updating job-config.json, VERSION file and registry tags")
            booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/DS_CI/Releng/update-version-and-registry-tags.jenkinsfile'))
            }
        }
    }
}
