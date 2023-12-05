import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = ["3.x"] // only one job
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/Releng/build-all-images.jenkinsfile')
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
            // disabled(config."Jobs"."build-all-images"[JB].disabled) 
            disabled(false)

            description('''
<p>Since this build depends on multiple upstream repos, this build is configured 
to trigger weekly on Sundays.
<p>
This job is meant to be used to orchestrate rebuilding everything in DS after a major branch update (7.yy.x -> 7.yy+1.x) or 
for global CVE updates.
<p>Do not abuse this job!
            ''')

            properties {
                ownership {
                    primaryOwnerId("sdawley")
                }

                pipelineTriggers {
                    triggers{
                        cron {
                            // 3.x: Sun at 23:HH
                            spec("H H * * 0") 
                        }
                    }
                }
            
                disableResumeJobProperty()
                disableConcurrentBuildsJobProperty()
            }

            quietPeriod(86400) // limit builds to 1 every 24 hrs (in sec)

            logRotator {
                daysToKeep(5)
                numToKeep(5)
                artifactDaysToKeep(2)
                artifactNumToKeep(2)
            }

            parameters{
                stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH)
                stringParam("PHASES", "1 2 3 4", '''
Phases:
<ol>
    <li> build internals in parallel (9 images): 
        <ul>
            <li> configbump, operator, dashboard, imagepuller, </li>
            <li> machineexec, pluginregistry, server, traefik, udi</li>
        </ul>
    </li>
    <li> build editors in parallel (2 images): 
        <ul>
            <li> code [depends on machineexec] </li>
            <li> idea [depends on machineexec] </li>
        </ul>
    </li>
    <li> build registry (1 image): 
        <ul>
            <li> devfileregistry [depends on pluginregistry] </li>
        </ul>
    </li>
    <li> build bundle image + IIBs</li>
</ol>
                    ''')
                stringParam("TIMEOUT", "600", "Override default timeout (in minutes) when building individual containers")
                booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/Releng/build-all-images.jenkinsfile'))
                }
            }
        }
    }
}
