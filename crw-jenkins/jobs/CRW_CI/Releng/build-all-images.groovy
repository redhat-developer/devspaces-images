import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config."Management-Jobs"."build-all-images".keySet()
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
            disabled(config."Management-Jobs"."build-all-images"[JB].disabled) 

            description('''
This job is meant to be used to orchestrate rebuilding everything in CRW after a major branch update (7.yy.x -> 7.zz.x) or for global CVE updates.
<p>Do not abuse this job!
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                pipelineTriggers {
                    triggers{
                        cron {
                            spec ('H 23 * * 5') // every Friday night at 23:HH
                        }
                    }
                }
            
                disableResumeJobProperty()
                disableConcurrentBuildsJobProperty()
            }

            logRotator {
                daysToKeep(5)
                numToKeep(5)
                artifactDaysToKeep(2)
                artifactNumToKeep(2)
            }

            parameters{
                stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH)
                stringParam("PHASES", "1 2 3 4 5", '''
Phases:
<ol>
    <li> build lang server dependencies (5 tarballs)</li>
    <li> build plugin and stack sidecar images (6 plugin, 4 stack sidecar images)</li>
    <li> build theia images (3 images)</li>
    <li> build internals (14 images): 
        <ul>
            <li> backup (@since 2.12), configbump, operator, dashboard, devfileregistry, </li>
            <li> idea, imagepuller, jwtproxy, machineexec, pluginbroker-artifacts, </li>
            <li> pluginbroker-metadata, pluginregistry, server, traefik,</li>
        </ul>
    </li>
    <li> build bundle + metadata images + IIBs</li>
</ol>
            ''')
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/Releng/build-all-images_' + JOB_BRANCH + '.jenkinsfile'))
                }
            }
        }
    }
}
