import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config.Jobs.pluginregistry?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/pluginregistry-plugins_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config.Jobs.pluginregistry[JB].disabled) // on reload of job, disable to avoid churn
            UPSTM_NAME="devspaces-vscode-extensions"
            SOURCE_REPO="redhat-developer/" + UPSTM_NAME
            SOURCE_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"

            //DS_VERSION = util.getDsVersion(SOURCE_BRANCH)
            def DS_VERSION = ("https://raw.githubusercontent.com/redhat-developer/devspaces/" + SOURCE_BRANCH + "/dependencies/VERSION").toURL().text
            DOWNLOAD_DIR="rcm-guest/staging/devspaces/build-requirements/devspaces-" + DS_VERSION + "-pluginregistry"

            description('''
Builds Visual Studio plugins used in the Dev Spaces plugin registry build and publishes them to <a href=https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/>https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/</a> so the artifacts can be fetched during OSBS container builds.

<ul>
<li>Source Repo: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
</ul>
<ul>
<li>Download Location: <a href=https://download.devel.redhat.com/''' + DOWNLOAD_DIR + '''>''' + DOWNLOAD_DIR + '''</a></li>
</ul>
            ''')

            properties {
                ownership {
                    primaryOwnerId("sdawley")
                }

                githubProjectUrl("https://github.com/" + SOURCE_REPO)

                disableResumeJobProperty()
            }

            logRotator {
                daysToKeep(5)
                numToKeep(5)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{
                stringParam("SOURCE_REPO", SOURCE_REPO)
                stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
                booleanParam("FORCE_BUILD_ALL", false, "If false, only build plugins with new commits; if true, rebuild everything. This is handy when adding new plugins, reverting commits, or if download.devel cache needs to be recreated.")
                booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/pluginregistry-plugins_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}
