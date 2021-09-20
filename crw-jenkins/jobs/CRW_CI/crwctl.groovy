import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// map branch to tag to use in operator.yaml and csv.yaml
def JOB_BRANCHES = config.Jobs.crwctl.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/crwctl_'+JB+'.jenkinsfile')
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
            disabled(config.Jobs.crwctl[JB].disabled) // on reload of job, disable to avoid churn
            UPSTM_NAME="chectl"
            SOURCE_REPO="che-incubator/" + UPSTM_NAME

            def cmd = "git ls-remote --heads https://github.com/" + SOURCE_REPO + ".git " + config.Jobs.crwctl[JB].upstream_branch[0]
            def BRANCH_CHECK=cmd.execute().text

            SOURCE_BRANCH=""+config.Jobs.crwctl[JB].upstream_branch[0];
            if (!BRANCH_CHECK) {
                SOURCE_BRANCH=""+config.Jobs.crwctl[JB].upstream_branch[1]
            }

            description('''
Artifact builder + sync job; triggers cli build after syncing from upstream

<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Downstream: <a href=https://github.com/redhat-developer/codeready-workspaces-chectl/tree/''' + MIDSTM_BRANCH + '''>crwctl</a></li>
</ul>

Results:  <a href=https://github.com/redhat-developer/codeready-workspaces-chectl/releases>chectl/releases</a>
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                githubProjectUrl("https://github.com/" + SOURCE_REPO)

                pipelineTriggers {
                    triggers{
                        pollSCM{
                            scmpoll_spec("H H/3 * * *") // every 3hrs
                        }
                    }
                }

                disableResumeJobProperty()
            }

            throttleConcurrentBuilds {
                maxPerNode(1)
                maxTotal(1)
            }

            logRotator {
                daysToKeep(15)
                numToKeep(15)
                artifactDaysToKeep(7)
                artifactNumToKeep(5)
            }

            parameters{
                stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                MMdd = ""+(new java.text.SimpleDateFormat("MM-dd")).format(new Date())
                stringParam("versionSuffix", "", '''
if set, use as version suffix before commitSHA: RC-''' + MMdd + ''' --> ''' + JOB_BRANCH + '''.0-RC-''' + MMdd + '''-commitSHA;<br/>
if unset, version is CRW_VERSION-YYYYmmdd-commitSHA<br/>
:: if suffix = GA, use server and operator tags from RHEC stage<br/>
:: if suffix contains RC, use server and operator tags from Quay<br/>
:: for all other suffixes, use server and operator tags = ''' + JOB_BRANCH + '''<br/>
:: NOTE: yarn will fail for version = x.y.z.a but works with x.y.z-a''')
                booleanParam("PUBLISH_ARTIFACTS_TO_GITHUB", false, "default false; check box to publish to GH releases")
                booleanParam("PUBLISH_ARTIFACTS_TO_RCM", false, "default false; check box to upload sources + binaries to RCM for a GA release ONLY")
            }

            // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
            authenticationToken('CI_BUILD')

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/crwctl_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}