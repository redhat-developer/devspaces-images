import groovy.json.JsonSlurper

def curlCMD = "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// map branch to floating quay tag to create
def JOB_BRANCHES = config."Management-Jobs"."push-latest-container-to-quay"?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/DS_CI/push-latest-container-to-quay_'+JB+'.jenkinsfile')
        FILE_CHECK = true
    }
    catch(err) {
        println "No jenkins file found for " + JB
    }
    if (FILE_CHECK) {
        JOB_BRANCH=""+JB
        MIDSTM_BRANCH="devspaces-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
        FLOATING_QUAY_TAGS="" + config.Other."FLOATING_QUAY_TAGS"[JB]
        OCP_VERSIONS="" + config.Other."OPENSHIFT_VERSIONS_SUPPORTED"[JB]?.join(" ")
        jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
        pipelineJob(jobPath){
            disabled(config."Management-Jobs"."push-latest-container-to-quay"[JB].disabled) // on reload of job, disable to avoid churn
            description('''
Push 1 or more containers from OSBS to quay.io/devspaces/ (or quay.io/crw/). 
Triggered by  <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>, but can be used manually too.</p>
   
<table>
    <tr><th colspan=4>Images to copy to quay (16):</th></tr>
    <tr><td>

        <li> <a href=https://quay.io/repository/devspaces/code-rhel8?tab=tags>code</a> @since 3.1</li>
        <li> <a href=https://quay.io/repository/devspaces/configbump-rhel8?tab=tags>configbump</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/devspaces-rhel8-operator?tab=tags>operator</a> 
        <li> <a href=https://quay.io/repository/devspaces/devspaces-operator-bundle?tab=tags>operator-bundle</a>
        <li> <a href=https://quay.io/repository/devspaces/dashboard-rhel8?tab=tags>dashboard</a></li>

        </td><td>

        <li> <a href=https://quay.io/repository/devspaces/devfileregistry-rhel8?tab=tags>devfileregistry</a></li>
        <li> <a href=https://quay.io/repository/devspaces/idea-rhel8?tab=tags>idea</a></li>
        <li> <a href=https://quay.io/repository/devspaces/imagepuller-rhel8?tab=tags>imagepuller</a></li>
        <li> <a href=https://quay.io/repository/devspaces/machineexec-rhel8?tab=tags>machineexec</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/pluginregistry-rhel8?tab=tags>pluginregistry</a></li>

        </td><td>

        <li> <a href=https://quay.io/repository/devspaces/server-rhel8?tab=tags>server</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/theia-dev-rhel8?tab=tags>theia-dev</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/theia-rhel8?tab=tags>theia</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/theia-endpoint-rhel8?tab=tags>theia-endpoint</a> </li>
        <li> <a href=https://quay.io/repository/devspaces/traefik-rhel8?tab=tags>traefik</a> </li>
        </td><td>

        <li> <a href=https://quay.io/repository/devspaces/udi-rhel8?tab=tags>udi</a></li>

    </td></tr>
  </table>
</ul>

<p>NOTE:  If no nodes are available, run: <br/>
    <b><a href=https://github.com/redhat-developer/devspaces/blob/devspaces-3-rhel-8/product/getLatestImageTags.sh>getLatestImageTags.sh</a> 
    -c "codeready-workspaces-udi-rhel8 codeready-workspaces-dashboard-rhel8" -b ''' + MIDSTM_BRANCH + ''' --osbs --pushtoquay="''' + 
    (JOB_BRANCH.equals("3.x") ? config.Version + ''' next''' : JOB_BRANCH+''' latest''') + 
    '''"</b>
  
  to get latest from osbs and push to quay.</p>

  <p>After this job runs:
  <ul>
    <li><a href=../update-digests_''' + JOB_BRANCH + '''>update-digests</a> will be triggered to check if those containers need a respin, and
    <li><a href=../theia-akamai_''' + JOB_BRANCH + '''>theia-akamai</a> will be triggered if we're publishing a <a href=../theia-sources_''' + JOB_BRANCH + '''>theia</a> build.
  </ul>
''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                disableResumeJobProperty()
            }

            throttleConcurrentBuilds {
                maxPerNode(2)
                maxTotal(10)
            }

            quietPeriod(120) // limit builds to 1 every 2 mins (in sec)

            logRotator {
                daysToKeep(45)
                numToKeep(90)
                artifactDaysToKeep(2)
                artifactNumToKeep(1)
            }

            parameters{ 
                textParam("CONTAINERS", '''\
configbump operator operator-bundle dashboard devfileregistry \
idea imagepuller machineexec pluginregistry server theia \
theia-dev theia-endpoint traefik udi''', '''list of 15 containers to copy:<br/>
* no 'devspaces/' or 'devspaces-' prefix><br/>
* no '-rhel8' suffix<br/>
* include one, some, or all as needed''')
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
                stringParam("OCP_VERSIONS", OCP_VERSIONS, '''Space-separated list of OCP versions supported by this release''')
                stringParam("FLOATING_QUAY_TAGS", FLOATING_QUAY_TAGS, "Update :" + FLOATING_QUAY_TAGS + " tag in addition to latest (3.y-zz) and base (3.y) tags.")
                booleanParam("CLEAN_ON_FAILURE", true, "If false, don't clean up workspace after the build so it can be used for debugging.")
            }

            // TODO: add email notification to nboldt@, anyone who submits a bad build, etc.

            // TODO: enable console log parser ?

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/DS_CI/push-latest-container-to-quay_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}