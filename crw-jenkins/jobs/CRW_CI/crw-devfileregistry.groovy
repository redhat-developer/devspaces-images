import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

def JOB_BRANCHES = config.Jobs.devfileregistry?.keySet()
for (JB in JOB_BRANCHES) {
    //check for jenkinsfile
    FILE_CHECK = false
    try {
        fileCheck = readFileFromWorkspace('jobs/CRW_CI/template_'+JB+'.jenkinsfile')
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
            disabled(config.Jobs.devfileregistry[JB].disabled) // on reload of job, disable to avoid churn
            UPSTM_NAME="che-devfile-registry"
            MIDSTM_NAME="devfileregistry"
            SOURCE_REPO_CHE="eclipse-che/" + UPSTM_NAME
            SOURCE_REPO="redhat-developer/codeready-workspaces"
            MIDSTM_REPO="redhat-developer/codeready-workspaces-images"

            def CMD = "git ls-remote --heads https://github.com/" + SOURCE_REPO + ".git " + config.Jobs.devfileregistry[JB].upstream_branch[0]
            def BRANCH_CHECK=CMD.execute().text

            SOURCE_BRANCH=""+config.Jobs.devfileregistry[JB].upstream_branch[0]
            if (!BRANCH_CHECK) {
                //devfileregistry uses crw-2.yy-rhel-8 so if branch doesn't exist use crw-2-rhel-8
                SOURCE_BRANCH="crw-2-rhel-8"
            }

            description('''
Artifact builder + sync job; triggers brew after syncing

<ul>
<li>Upstream Che: <a href=https://github.com/''' + SOURCE_REPO_CHE + '''>''' + UPSTM_NAME + '''</a></li>
<li>Upstream CRW: <a href=https://github.com/''' + SOURCE_REPO + '''/tree/''' + MIDSTM_BRANCH + '''/dependencies/''' + UPSTM_NAME + '''/>''' + UPSTM_NAME + '''</a></li>
<li>Midstream: <a href=https://github.com/''' + MIDSTM_REPO + '''/tree/''' + MIDSTM_BRANCH + '''/codeready-workspaces-''' + MIDSTM_NAME + '''/>crw-''' + MIDSTM_NAME + '''</a></li>
<li>Downstream: <a href=http://pkgs.devel.redhat.com/cgit/containers/codeready-workspaces-''' + MIDSTM_NAME + '''?h=''' + MIDSTM_BRANCH + '''>''' + MIDSTM_NAME + '''</a></li>

</ul>

<p>If <b style="color:green">downstream job fires</b>, see 
<a href=../sync-to-downstream_''' + JOB_BRANCH + '''/>sync-to-downstream</a>, then
<a href=../get-sources-rhpkg-container-build_''' + JOB_BRANCH + '''/>get-sources-rhpkg-container-build</a>. <br/>
   If <b style="color:orange">job is yellow</b>, no changes found to push, so no container-build triggered. </p>
<p>Results:<ul><li><a href=https://quay.io/crw/'''+MIDSTM_NAME+'''-rhel8>quay.io/crw/'''+MIDSTM_NAME+'''-rhel8</a></li></ul></p>
            ''')

            properties {
                ownership {
                    primaryOwnerId("nboldt")
                }

                githubProjectUrl("https://github.com/" + SOURCE_REPO)

                pipelineTriggers {
                    triggers{
                        genericTrigger {
                            genericVariables {
                                genericVariable {
                                    key("ref")
                                    value('\$.ref')
                                    expressionType("JSONPath")
                                    regexpFilter("")
                                    defaultValue("")
                                }
                                genericVariable {
                                    key("name")
                                    value('\$.repository.full_name')
                                    expressionType("JSONPath")
                                    regexpFilter("")
                                    defaultValue("")
                                }
                                genericVariable {
                                    key("files")
                                    value('\$.commits[*].[\'modified\',\'added\',\'removed\'][*]')
                                    expressionType("JSONPath")
                                    regexpFilter("")
                                    defaultValue("")
                                }
                            }
                            token('')
                            tokenCredentialId('')
                            printContributedVariables(true)
                            printPostContent(true)
                            causeString("Generic Webhook Trigger for changes to https://github.com/" + SOURCE_REPO)
                            silentResponse(false)
                            regexpFilterText('$ref $files $name')
                            regexpFilterExpression('refs/heads/' + SOURCE_BRANCH + ' .*"dependencies/' + UPSTM_NAME + '/[^"]+?".* '+ SOURCE_REPO)
                        }
                    }
                }

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
                stringParam("MIDSTM_REPO", MIDSTM_REPO)
                stringParam("MIDSTM_BRANCH", MIDSTM_BRANCH)
                stringParam("MIDSTM_NAME", MIDSTM_NAME)
                booleanParam("FORCE_BUILD", false, "If true, trigger a rebuild even if no changes were pushed to pkgs.devel")
            }

            definition {
                cps{
                    sandbox(true)
                    script(readFileFromWorkspace('jobs/CRW_CI/template_'+JOB_BRANCH+'.jenkinsfile'))
                }
            }
        }
    }
}
