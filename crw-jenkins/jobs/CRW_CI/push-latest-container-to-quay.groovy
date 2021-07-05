// map branch to floating quay tag to create
def FLOATING_QUAY_TAGS = [
    "2.9":"2.9",
    "2.10":"latest",
    "2.x" :"nightly"
    ]
def JOB_BRANCHES = ["2.9":"", "2.10":"", "2.x":""]
def JOB_DISABLED = ["2.9":true, "2.10":true, "2.x":false]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB.key
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(JOB_DISABLED[JB.key]) // on reload of job, disable to avoid churn
        description('''
Push 1 or more containers from OSBS to quay.io/crw/. 
Triggered by  <a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>, but can be used manually too.
   
<p>
  
Images to copy to quay:
<table>
<tr><td>

  <li> <a href=https://quay.io/repository/crw/configbump-rhel8?tab=tags>configbump</a> </li>
  <li> <a href=https://quay.io/repository/crw/crw-2-rhel8-operator?tab=tags>operator</a> 
  <li> <a href=https://quay.io/repository/crw/crw-2-rhel8-operator-metadata?tab=tags>operator-metadata</a></li>
  <li> <a href=https://quay.io/repository/crw/dashboard-rhel8?tab=tags>dashboard</a> @since 2.9</li>
  <li> <a href=https://quay.io/repository/crw/devfileregistry-rhel8?tab=tags>devfileregistry</a></li>

  </td><td>

  <li> <a href=https://quay.io/repository/crw/devworkspace-controller-rhel8?tab=tags>devworkspace-controller</a> @since 2.8</li>
  <li> <a href=https://quay.io/repository/crw/devworkspace-rhel8?tab=tags>devworkspace</a> @since 2.8</li>
  <li> <a href=https://quay.io/repository/crw/imagepuller-rhel8?tab=tags>imagepuller</a></li>
  <li> <a href=https://quay.io/repository/crw/jwtproxy-rhel8?tab=tags>jwtproxy</a> </li>
  <li> <a href=https://quay.io/repository/crw/machineexec-rhel8?tab=tags>machineexec</a> </li>

  </td><td>

  <li> <a href=https://quay.io/repository/crw/pluginbroker-artifacts-rhel8?tab=tags>pluginbroker-artifacts</a> </li>
  <li> <a href=https://quay.io/repository/crw/pluginbroker-metadata-rhel8?tab=tags>pluginbroker-metadata</a></li>
<!--   <li> <a href=https://quay.io/repository/crw/plugin-intellij-rhel8?tab=tags>plugin-intellij</a></li> -->
  <li> <a href=https://quay.io/repository/crw/plugin-java11-openj9-rhel8?tab=tags>plugin-java11-openj9</a></li>
  <li> <a href=https://quay.io/repository/crw/plugin-java11-rhel8?tab=tags>plugin-java11</a></li>
  <li> <a href=https://quay.io/repository/crw/plugin-java8-openj9-rhel8?tab=tags>plugin-java8-openj9</a> 

  </td><td>

  <li> <a href=https://quay.io/repository/crw/plugin-java8-rhel8?tab=tags>plugin-java8</a> 
  <li> <a href=https://quay.io/repository/crw/plugin-kubernetes-rhel8?tab=tags>plugin-kubernetes</a></li>
  <li> <a href=https://quay.io/repository/crw/plugin-openshift-rhel8?tab=tags>plugin-openshift</a> </li>
  <li> <a href=https://quay.io/repository/crw/pluginregistry-rhel8?tab=tags>pluginregistry</a></li>
  <li> <a href=https://quay.io/repository/crw/server-rhel8?tab=tags>server</a> </li>

  </td></tr><tr><td>

  <li> <a href=https://quay.io/repository/crw/stacks-cpp-rhel8?tab=tags>stacks-cpp</a> </li>
  <li> <a href=https://quay.io/repository/crw/stacks-dotnet-rhel8?tab=tags>stacks-dotnet</a> </li>
  <li> <a href=https://quay.io/repository/crw/stacks-golang-rhel8?tab=tags>stacks-golang</a> </li>
  <li> <a href=https://quay.io/repository/crw/stacks-php-rhel8?tab=tags>stacks-php</a> </li>
  <li> <a href=https://quay.io/repository/crw/theia-rhel8?tab=tags>theia</a> </li>

  </td><td>

  <li> <a href=https://quay.io/repository/crw/theia-dev-rhel8?tab=tags>theia-dev</a> </li>
  <li> <a href=https://quay.io/repository/crw/theia-endpoint-rhel8?tab=tags>theia-endpoint</a> </li>
  <li> <a href=https://quay.io/repository/crw/traefik-rhel8?tab=tags>traefik</a> </li>

  </td></tr>
  </table>
</ul>
            <p>NOTE:  If no nodes are available, run: <br/>
    <b><a href=https://github.com/redhat-developer/codeready-workspaces/blob/crw-2-rhel-8/product/getLatestImageTags.sh>getLatestImageTags.sh</a> 
    -c "codeready-workspaces-plugin-openshift-rhel8" --osbs --pushtoquay="''' + 
    (JOB_BRANCH.equals("2.x") ? '''2.y nightly''' : JOB_BRANCH+''' latest''') + 
    '''"</b>
  
  to get latest from osbs and push to quay.

  <p>After this job runs, <a href=../update-digests-in-registries-and-metadata_''' + JOB_BRANCH + '''>update-digests-in-registries-and-metadata</a> will be triggered to check if those containers need a respin.
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

        // limit builds to 1 every 2 mins
        quietPeriod(120) // in sec

        logRotator {
            daysToKeep(10)
            numToKeep(10)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        /* requires naginator plugin */
        /* publishers {
            retryBuild {
                rerunIfUnstable()
                retryLimit(1)
                progressiveDelay(30,90)
            }
        } */

        parameters{ // plugin-intellij
            textParam("CONTAINERS", '''\
configbump operator operator-metadata dashboard devfileregistry \
devworkspace-controller devworkspace imagepuller jwtproxy machineexec \
pluginbroker-metadata pluginbroker-artifacts plugin-java11-openj9 plugin-java11 plugin-java8-openj9 \
plugin-java8 plugin-kubernetes plugin-openshift pluginregistry server \
stacks-cpp stacks-dotnet stacks-golang stacks-php theia \
theia-dev theia-endpoint traefik''', '''list of containers to copy:<br/>
* no 'crw/' or 'codeready-workspaces-' prefix><br/>
* no '-rhel8' suffix<br/>
* include one, some, or all as needed''')
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH, "")
            stringParam("FLOATING_QUAY_TAGS", FLOATING_QUAY_TAGS[JB.key], "Update :" + FLOATING_QUAY_TAGS[JB.key] + " tag in addition to latest (2.y-zz) and base (2.y) tags.")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        // TODO: enable naginator plugin to re-trigger if job fails

        // TODO: add email notification to nboldt@, anyone who submits a bad build, etc.

        // TODO: enable console log parser ?

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/push-latest-container-to-quay_'+JOB_BRANCH+'.jenkinsfile'))
            }
        }
    }
}