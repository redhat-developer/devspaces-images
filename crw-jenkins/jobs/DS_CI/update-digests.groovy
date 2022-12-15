import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Management-Jobs"."update-digests"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/update-digests_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config."Management-Jobs"."update-digests"[JB].disabled) // on reload of job, disable to avoid churn
            description('''
This job will cause the <a href=../operator-bundle_''' + JOB_BRANCH + '''>operator-bundle_''' + JOB_BRANCH + '''</a> job to run, rebuilding if any new images 
are found in <a href=https://quay.io/devspaces/>quay.io/devspaces/</a> using 
<a href=https://github.com/redhat-developer/devspaces/blob/devspaces-3-rhel-8/product/getLatestImageTags.sh>
./getLatestTags.sh -b ''' + MIDSTM_BRANCH + ''' --quay --hide</a>.
<p>
  Results:
  <ul>
    <li><a href=https://quay.io/repository/devspaces/devspaces-operator-bundle?tag=latest&tab=tags>quay.io/devspaces/devspaces-operator-bundle</a></li>
</ul>

<p> If this job is ever disabled and you want to update the LATEST_IMAGES files yourself, run 
  <a href=https://github.com/redhat-developer/devspaces/blob/devspaces-''' + JOB_BRANCH + '''-rhel-8/dependencies/LATEST_IMAGES.sh>LATEST_IMAGES.sh --commit</a>
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                pipelineTriggers {
                    triggers {
                        cron {
                            spec ('H H/4 * * *') // every 4 hrs
                        }
                    }
                }

                disableResumeJobProperty()
                disableConcurrentBuildsJobProperty()
            }

            throttleConcurrentBuilds {
                maxPerNode(1)
                maxTotal(1)
            }
            
            quietPeriod(14400) // limit builds to 1 every 4 hrs (in sec)

            logRotator {
                daysToKeep(45)
                numToKeep(90)
                artifactDaysToKeep(5)
                artifactNumToKeep(5)
            }

            parameters{
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/update-digests_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}