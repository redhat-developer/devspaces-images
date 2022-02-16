import groovy.json.JsonSlurper

def curlCMD = "https://raw.github.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json".toURL().text

def jsonSlurper = new JsonSlurper();
def config = jsonSlurper.parseText(curlCMD);

// for 2.yy, return 2.yy-1
def computePreviousVersion(String ver){
    verBits=ver.tokenize(".")
    int vb1=Integer.parseInt(verBits[1])
    if (vb1==0) {
        return verBits[0] + ".0"
    } else {
        return verBits[0] + "." + (vb1-1)
    }
}

def JOB_BRANCHES = [computePreviousVersion(config.Version+"")] // only one release at a time, previous stable one (2.yy-1)
for (String JOB_BRANCH : JOB_BRANCHES) {
    pipelineJob("${FOLDER_PATH}/${ITEM_NAME}"){
        // keep job disabled until we explicitly need it
        disabled(true)

        MIDSTM_BRANCH="crw-" + JOB_BRANCH.replaceAll(".x","") + "-rhel-8"

        description('''
Collect sources from pkgs.devel and vsix files and push to rcm-guest so they can be published as part of a GA release. 
<br/><br/>
If the <b>stage-mw-release</b> command fails, you can re-run it locally without having to re-run this whole job:
<p>
<blockquote>
<pre>
kinit kinit -k -t /path/to/crw-build.keytab crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com@REDHAT.COM
ssh crw-build/codeready-workspaces-jenkins.rhev-ci-vms.eng.rdu2.redhat.com@rcm-guest.app.eng.bos.redhat.com

[crw-build@rcm-guest ~]$ /mnt/redhat/scripts/rel-eng/utility/bus-clients/stage-mw-release CRW-2.15.0
Staged CRW-2.yy.z in 0:04:30.158899
</pre>
</blockquote>
</p>
        ''')

        properties {
            ownership {
                primaryOwnerId("nboldt")
            }
        }

        logRotator {
            daysToKeep(5)
            numToKeep(5)
            artifactDaysToKeep(5)
            artifactNumToKeep(2)
        }

        parameters{
            stringParam("MIDSTM_BRANCH",MIDSTM_BRANCH,"redhat-developer/codeready-workspaces branch to use")
            booleanParam("PUBLISH_ARTIFACTS_TO_RCM", false, "default false; check box to upload sources + binaries to RCM for a GA release ONLY")
        }

        definition {
            cps{
                sandbox(true)
                script(readFileFromWorkspace('jobs/CRW_CI/Releng/' + ITEM_NAME + '.jenkinsfile'))
            }
        }
    }
}
