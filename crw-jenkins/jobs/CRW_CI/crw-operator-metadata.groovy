import groovy.json.JsonSlurper

def curlCMD = "curl -sSL https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".execute().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = ["2.12", "2.11", "2.x"]
for (JB in JOB_BRANCHES) {
    JOB_BRANCH=""+JB
    MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"
    jobPath="${FOLDER_PATH}/${ITEM_NAME}_" + JOB_BRANCH
    pipelineJob(jobPath){
        disabled(config.Jobs."operator-metadata"[JB].disabled) // on reload of job, disable to avoid churn
        UPSTM_NAME="che-operator"
        MIDSTM_NAME="operator-metadata"
        SOURCE_REPO="eclipse/" + UPSTM_NAME
        SOURCE_REPO="eclipse-che/" + UPSTM_NAME
        MIDSTM_REPO="redhat-developer/codeready-workspaces-images"
        CSV_VERSION=config.CSVs."operator-metadata"[JB].CSV_VERSION
        CSV_VERSION_PREV=config.CSVs."operator-metadata"[JB].CSV_VERSION_PREV

        def cmd = "git ls-remote --heads https://github.com/" + SOURCE_REPO + ".git " + config.Jobs."operator-metadata"[JB].upstream_branch[0]
        def BRANCH_CHECK=cmd.execute().text

        SOURCE_BRANCH=""+config.Jobs."operator-metadata"[JB].upstream_branch[0];
        if (!BRANCH_CHECK) {
            SOURCE_BRANCH=""+config.Jobs."operator-metadata"[JB].upstream_branch[1]
        }

        description('''
Artifact builder + sync job; triggers brew after syncing

<p>There are three operator-related sync jobs:<br/>
1. <a href=../crw-operator_''' + JOB_BRANCH + '''>crw-operator_''' + JOB_BRANCH + '''</a>: go code<br/>
2. <a href=../crw-operator-metadata_''' + JOB_BRANCH + '''>crw-operator-metadata_''' + JOB_BRANCH + '''</a>: CRD, CSV [deprecated, OCP 4.6]</p>
3. <a href=../crw-operator-bundle_''' + JOB_BRANCH + '''>crw-operator-bundle_''' + JOB_BRANCH + '''</a>: CRD, CSV [@since 2.12, OCP 4.8+]</p>

<ul>
<li>Upstream: <a href=https://github.com/''' + SOURCE_REPO + '''>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/''' + MIDSTM_REPO + '''/tree/''' + MIDSTM_BRANCH + '''/codeready-workspaces-''' + MIDSTM_NAME + '''/>crw-''' + MIDSTM_NAME + '''</a></li>
<li>Downstream: <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>''' + MIDSTM_NAME + '''</a></li>
</ul>

<p>If <b style="color:green">downstream job fires</b>, see 
<a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream</a>, then
<a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>

<p> If this job is ever disabled and you want to update the LATEST_IMAGES files yourself, see 
<a href=https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh>https://github.com/redhat-developer/codeready-workspaces/blob/''' + MIDSTM_BRANCH + '''/dependencies/LATEST_IMAGES.sh</a>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }

            githubProjectUrl("https://github.com/" + SOURCE_REPO)

            pipelineTriggers {
                triggers{
                    pollSCM{
                        scmpoll_spec("H H/2 * * *") // every 2hrs
                    }
                }
            }

            disableResumeJobProperty()
        }

        // limit builds to 1 every 20 min
        quietPeriod(1200) // in sec

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(2)
            artifactNumToKeep(1)
        }

        parameters{
            stringParam("SOURCE_REPO", SOURCE_REPO)
            stringParam("SOURCE_BRANCH", SOURCE_BRANCH)
            stringParam("MIDSTM_REPO", MIDSTM_REPO)
            stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
            stringParam("MIDSTM_NAME", MIDSTM_NAME)
            // TODO compute these from https://github.com/redhat-developer/codeready-workspaces/blob/crw-2-rhel-8/dependencies/VERSION.json
            stringParam("CSV_VERSION", CSV_VERSION)
            stringParam("CSV_VERSION_PREV", CSV_VERSION_PREV)
            booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
        }

        // Trigger builds remotely (e.g., from scripts), using Authentication Token = CI_BUILD
        authenticationToken('CI_BUILD')

        definition {
            cps{
                sandbox(true)
                if (JOB_BRANCH.equals("2.10")) {
                    script(readFileFromWorkspace('jobs/CRW_CI/crw-operator-metadata_'+JOB_BRANCH+'.jenkinsfile'))
                } else {
                    script(readFileFromWorkspace('jobs/CRW_CI/template_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}