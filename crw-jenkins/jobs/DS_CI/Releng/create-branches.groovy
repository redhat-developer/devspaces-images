import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// for 3.yy, return 3.yy-1
def computePrevVersion(String ver){
    verBits=ver.tokenize(".")
    int vb1=Integer.parseInt(verBits[1])
    return verBits[0] + "." + (vb1-1)
}

def PREV_VERSION = computePrevVersion(config.Version+"")

def JOB_BRANCHES = [config.Version+""] // only one release at a time, latest 2.yy
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        // keep job disabled until we explicitly need it
        disabled(true)

        MIDSTM_BRANCH="devspaces-3-rhel-8"
        NEW_BRANCH="devspaces-"+PREV_VERSION+"-rhel-8"

        description('''
This job is meant to be run after upstream 7.yy.x branches are available to start the new devspaces-3.y-rhel-8 github branches for the upcoming release.
<p>
See <a href=https://github.com/redhat-developer/devspaces/blob/devspaces-3-rhel-8/product/tagRelease.sh>
https://github.com/redhat-developer/devspaces/blob/devspaces-3-rhel-8/product/tagRelease.sh</a>

<p>Pass in values like these to create/update the ''' + PREV_VERSION + ''' and 3.x (''' + JOB_BRANCH + ''') branches, including devfiles in sample projects:
<ul><li>DS_VERSION = ''' + PREV_VERSION + '''</li>
<li><li>MIDSTM_BRANCH = devspaces-3-rhel-8 (''' + JOB_BRANCH + ''')</li>
<li><li>NEW_BRANCH = devspaces-''' + PREV_VERSION + '''-rhel-8</li>
</ul>
</p>

<p>To create branches of pkgs.devel repos, open a ticket like <a href=https://projects.engineering.redhat.com/browse/SPMM-4820>SPMM-4820</a>

  <p>NOTE: this job is not meant to create tags in repos, as branching occurs BEFORE GA, and tagging occurs AFTER.
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
            stringParam("DS_VERSION",PREV_VERSION,"version to use in NEW_BRANCH; " + MIDSTM_BRANCH + " branch will also be updated to " + JOB_BRANCH)
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/devspaces branch to use as source of the new branches")
            stringParam("NEW_BRANCH",NEW_BRANCH,"branches to create")
            booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/DS_CI/Releng/create-branches.jenkinsfile'))
            }
        }
    }
}
