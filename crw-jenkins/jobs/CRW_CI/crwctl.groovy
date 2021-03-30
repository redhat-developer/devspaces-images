// map branch to tag to use in operator.yaml and csv.yaml
def CSV_QUAY_TAGS = [
    "2.7": "2.7",
    "2.8": "latest",
    "2.x": "nightly"
    ]
def CSV_VERSIONS = [
    "2.7": "2.7.1",
    "2.8": "2.8.0",
    "2.x": "2.9.0"
    ]
def JOB_BRANCHES = ["2.7":"7.26.x", "2.8":"7.28.x", , "2.x":"master"]
def JOB_DISABLED = ["2.7":true, "2.8":false, "2.x":false]
for (JB in JOB_BRANCHES) {
    SOURCE_BRANCH=JB.value
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        UPSTM_NAME="chectl"
        UPSTM_REPO="https://github.com/che-incubator/" + UPSTM_NAME

        description('''
Artifact builder + sync job; triggers cli build after syncing from upstream

<ul>
<li>Upstream: <a href=''' + UPSTM_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Downstream: <a href=https://github.com/redhat-developer/codeready-workspaces-chectl/tree/''' + MIDSTM_BRANCH + '''>crwctl</a></li>
</ul>

Results:  <a href=https://github.com/redhat-developer/codeready-workspaces-chectl/releases>chectl/releases</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            pipelineTriggers {
                triggers{
                    pollSCM{
                        scmpoll_spec("H H/8 * * *") // every 8hrs
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
            stringParam("CSV_VERSION", CSV_VERSIONS[JB.key], "Full version (x.y.z), used in CSV and crwctl version")
            stringParam("CSV_QUAY_TAG", CSV_QUAY_TAGS[JB.key], "Floating tag to use operator.yaml and csv.yaml")
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