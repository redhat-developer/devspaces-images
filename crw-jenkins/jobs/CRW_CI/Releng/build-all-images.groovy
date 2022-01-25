import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Jobs"."build-all-images"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/Releng/build-all-images_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            // keep job disabled until we explicitly need it
            disabled(config."Jobs"."build-all-images"[JB].disabled) 

            description('''
<p>Since this build depends on multiple upstream repos (eclipse theia, che-theia), this build is configured 
to trigger weekly on ''' + (JOB_BRANCH.equals("2.x") ? "Sundays" : "Saturdays") + '''.
<p>
This job is meant to be used to orchestrate rebuilding everything in CRW after a major branch update (7.yy.x -> 7.yy+1.x) or 
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
                            // 2.x: Sun at 23:HH; 2.yy: Sat
                            spec(JOB_BRANCH.equals("2.x") ? "H H * * 0" : "H H * * 6") 
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
    <!-- TODO in 2.15 or 2.16, switch to UDI -->
    <li> build udi and stack sidecar images (2 universal developer images, 4 stack sidecar images)</li>
    <li> build theia images (3 images)</li>
    <li> build internals (14 images): 
        <ul>
            <li> backup (@since 2.12), configbump, operator, dashboard, </li>
            <li> devfileregistry, idea (@since 2.11), imagepuller, jwtproxy, machineexec, </li>
            <li> pluginbroker-artifacts, pluginbroker-metadata, pluginregistry, server, traefik</li>
        </ul>
    </li>
    <li> build bundle + metadata images + IIBs</li>
</ol>
                    ''')
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/Releng/build-all-images_' + JOB_BRANCH + '.jenkinsfile'))
                }
            }
        }
    }
}
