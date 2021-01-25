#!/bin/bash

# script to:
# temporarily delete all but this folder, then 
# curl a rebuild of the job-configurator

foldersToExclude="Che/ CodereadyWorkspaces/ Examples/ DevSandbox/ Flexy/ Playground/ system/"
clear
pushd .. >/dev/null || exit

    # must setup job-configurator to enable it to be run from a script
    result=$(curl -sSL "http://localhost:8080/job/job-configurator/buildWithParameters?token=TOKEN" 2>&1) # echo $result
    if [[ $result == *"hudson.model.Item.Build"* ]] || [[ $result == *"port 8080: Connection refused"* ]]; then
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
        sleep 20s

        # put back the deleted files
        mv -f ${tmpdir}/* ./ || git checkout ${foldersToExclude}
        rm -fr ${tmpdir}
        echo 
    fi

popd >/dev/null || exit
