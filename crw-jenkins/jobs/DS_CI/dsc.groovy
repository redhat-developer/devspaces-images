import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// map branch to tag to use in operator.yaml and csv.yaml
def JOB_BRANCHES = config."Management-Jobs".dsc?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/dsc_'+JB+'.jenkinsfile')
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
            disabled(config."Management-Jobs".dsc[JB].disabled) // on reload of job, disable to avoid churn
            UPSTM_NAME="chectl"
            SOURCE_REPO="che-incubator/" + UPSTM_NAME

            def CMD_EVEN="git ls-remote --heads https://github.com/" + SOURCE_REPO + ".git " + config."Management-Jobs".dsc[JB].upstream_branch[0]
            def CMD_ODD="git ls-remote --heads https://github.com/" + SOURCE_REPO + ".git " + config."Management-Jobs".dsc[JB].upstream_branch[1]

            def BRANCH_CHECK_EVEN=CMD_EVEN.execute().text
            def BRANCH_CHECK_ODD=CMD_ODD.execute().text

            SOURCE_BRANCH="main"
            if (BRANCH_CHECK_EVEN) {
                SOURCE_BRANCH=""+config."Management-Jobs".dsc[JB].upstream_branch[0]
            } else if (BRANCH_CHECK_ODD) {
                SOURCE_BRANCH=""+config."Management-Jobs".dsc[JB].upstream_branch[1]
            }

            description('''
Artifact builder + sync job; triggers cli build after syncing from upstream

<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Downstream: <a href=https://github.com/redhat-developer/devspaces-chectl/tree/''' + MIDSTM_BRANCH + '''>dsc</a></li>
</ul>
''' + 
((!JOB_BRANCH.equals("3.8") && !JOB_BRANCH.equals("3.9")) ? 
'''
Results: <ul><li> <a href=https://quay.io/repository/devspaces/dsc?tab=tags>quay.io/devspaces/dsc</a> </li></ul>
<p><blockquote>
    To install dsc from a container image for your OS & arch:
    <pre>
        cd /tmp
        git clone https://github.com/redhat-developer/devspaces-chectl --depth=1 dsc-checkout && cd dsc-checkout
        ./build/scripts/installDscFromContainer.sh quay.io/devspaces/dsc:'''+(JOB_BRANCH.equals("3.x")?"next":JOB_BRANCH+"")+'''</pre>
</blockquote></p>
''' : 
'''
Results: <ul><li> <a href=https://github.com/redhat-developer/devspaces-chectl/releases>chectl/releases</a> </li></ul>
<p><blockquote>
    To retrieve assets from github:
    <pre>
        cd /tmp
        git clone git@github.com:redhat-developer/devspaces-chectl.git --depth=1 dsc && cd dsc

        export GITHUB_TOKEN="github-token-here"

        hub release download '''+(config.CSVs."operator-bundle"[JB].CSV_VERSION)+'''-CI-dsc-assets -i LIST
        ...
        hub release download '''+(config.CSVs."operator-bundle"[JB].CSV_VERSION)+'''-CI-dsc-assets -i "*dsc-linux-x64*"</pre>
</blockquote></p>
''') + 
'''
<p><blockquote>
    For GA builds only: if the <b>stage-mw-release</b> command fails, you can re-run it locally without having to re-run this whole job:
    <pre>
        kinit kinit -k -t /path/to/devspaces-build-keytab devspaces-build@IPA.REDHAT.COM
        REMOTE_USER_AND_HOST="devspaces-build@spmm-util.hosts.stage.psi.bos.redhat.com"
        ssh "${REMOTE_USER_AND_HOST}" "stage-mw-release devspaces-3.yy.z.yyyy-mm-dd"
        Staged devspaces-3.yy.z.2023-03-21 in 0:04:30.158899</pre>
</blockquote></p>
''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                githubProjectUrl("https://github.com/" + SOURCE_REPO)

                JobSharedUtils.enableDefaultPipelineWebhookTrigger(delegate, SOURCE_BRANCH, SOURCE_REPO) 

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
                stringParam("DSC_VERSION", "", "Leave blank to compute version of dsc binary from CSV")
                stringParam("versionSuffix", "CI", '''
if set, use as version suffix before commitSHA: RC-''' + MMdd + ''' --> ''' + JOB_BRANCH + '''.0-RC-''' + MMdd + '''-commitSHA;<br/>
if unset, version is DS_VERSION-YYYYmmdd-commitSHA<br/>
:: if suffix = GA, use server and operator tags from RHEC stage<br/>
:: if suffix contains RC, use server and operator tags from Quay<br/>
:: for all other suffixes, use server and operator tags = ''' + JOB_BRANCH + '''<br/>
:: NOTE: yarn will fail for version = x.y.z.a but works with x.y.z-a<br/>
<br/>
* push all CI and RC bits to GH<br/>
* for GA suffix, push to GH and spmm-util; run <tt>stage-mw-release devspaces-3.yy.z.yyyy-mm-dd</tt> 
''')
                // TODO remove this if block when 3.9 is live; only use config.Other.NODE_VERSION[JB] for nodeVersion
                // CRW-4820 up to 3.8, use config."Management-Jobs".dsc[JB].node_version; for 3.9+ use config.Other.NODE_VERSION[JB]
                if (!JOB_BRANCH.equals("3.7") && !JOB_BRANCH.equals("3.8")) {
                    stringParam("nodeVersion", config.Other.NODE_VERSION[JB], "Common node version used to build dsc")
                } else {
                    stringParam("nodeVersion", config."Management-Jobs".dsc[JB].node_version, "Custom node version used to build dsc")
                }
                booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
            }
            
            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/dsc_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}