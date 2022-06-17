import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Jobs"."build-all-images"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/Releng/build-all-images_'+JB+'.jenkinsfile')
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
            // keep job disabled until we explicitly need it
            disabled(config."Jobs"."build-all-images"[JB].disabled) 

            description('''
<p>Since this build depends on multiple upstream repos (eclipse theia, che-theia), this build is configured 
to trigger weekly on ''' + (JOB_BRANCH.equals("3.x") ? "Sundays" : "Saturdays") + '''.
<p>
This job is meant to be used to orchestrate rebuilding everything in DS after a major branch update (7.yy.x -> 7.yy+1.x) or 
for global CVE updates.
<p>Do not abuse this job!
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                pipelineTriggers {
                    triggers{
                        cron {
                            // 3.x: Sun at 23:HH; 3.yy: Sat
                            spec(JOB_BRANCH.equals("3.x") ? "H H * * 0" : "H H * * 6") 
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
                stringParam("PHASES", "1 2 3", '''
Phases:
<ol>
    <li> build theia images sequentially (3 images)</li>
    <li> build internals in parallel (11 images): 
        <ul>
            <li> configbump, operator, dashboard, devfileregistry, idea (@since 2.11), </li>
            <li> imagepuller, machineexec, pluginregistry, server, traefik, udi (@since 2.16)</li>
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
                    script(readFileFromWorkspace('jobs/DS_CI/Releng/build-all-images_' + JOB_BRANCH + '.jenkinsfile'))
                }
            }
        }
    }
}
