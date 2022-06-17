#!/bin/bash

# script to:
# temporarily delete all but this folder, then 
# curl a rebuild of the job-configurator

usageReenable()
{
    echo "To re-enable jobs that were disabled by job-configurator, you must:"
    echo "  1. open http://localhost:8080/me/configure"
    echo "  2. create an API token"
    echo "  3. store your kerberos username and token in file /tmp/token, in format:"
    echo 
    echo "username:token"
}

waitBeforeReenable=40s # time to let the job configurator run before re-enabling jobs
foldersToExclude="Che/ CodereadyWorkspaces/ Examples/ DevSandbox/ Flexy/ Playground/ system/ WTO/"
clear
pushd .. >/dev/null || exit

    # must setup job-configurator to enable it to be run from a script
    result=$(curl -sSL "http://localhost:8080/job/job-configurator/buildWithParameters?token=TOKEN" 2>&1) 
    echo $result
    if [[ $result == *"hudson.model.Item.Build"* ]] || [[ $result == *"port 8080: Connection refused"* ]] || [[ $result == *"Authentication required"* ]]; then
        echo "Before you can run this script, you must:"
        echo "  1. log in to http://localhost:8080/login?from=%2Fjob%2Fjob-configurator%2Fconfigure"
        echo "  2. open http://localhost:8080/job/job-configurator/configure"
        echo "  3. enable 'Trigger builds remotely (e.g., from scripts)'"
        echo "  4. set 'Authentication Token' to be TOKEN"
        echo "  5. save changes"
    else
        # remove jobs we don't care about to a temp folder
        tmpdir=$(mktemp -d)
        mv -f ${foldersToExclude} ${tmpdir}
        rm -f system/crw-jenkins-*

        echo "Job configurator triggered. Watch for completion in console where Jenkins is running, or open this page: "
        echo "http://localhost:8080/job/job-configurator/lastBuild/console"
        sleep ${waitBeforeReenable}

        # put back the deleted files
        mv -f ${tmpdir}/* ./ || git checkout ${foldersToExclude}
        rm -fr ${tmpdir}

        # re-enable disabled jobs
        if [[ -f /tmp/token ]]; then
            USERTOKEN=$(cat /tmp/token)
            for VER in "3.x"; do # "2.y"
                for JOB in \
                    sync-to-downstream \
                    get-sources-rhpkg-container-build \
                    push-latest-container-to-quay \
                    update-digests-in-metadata operator-bundle \
                    ; do
                    result=$(curl -sSL -X POST "http://localhost:8080/job/DS_CI/job/${JOB}_${VER}/enable" --user "${USERTOKEN}" | grep -E "Unauthorized|Authentization|401|URI")
                    if [[ $result ]]; then
                        echo "ERROR!"
                        echo "$result"
                        echo
                        usageReenable
                        break 2
                    else
                        echo "Enabled: http://localhost:8080/job/DS_CI/job/${JOB}_${VER}/"
                    fi
                done
            done
        else
          usageReenable
        fi
    fi

popd >/dev/null || exit
