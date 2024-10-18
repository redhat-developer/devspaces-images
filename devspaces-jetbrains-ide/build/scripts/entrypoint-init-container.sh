#!/bin/sh
#
# Copyright (c) 2023-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# Being called as a pre-start command, the script downloads the requested IDE and
# copies the binaries to the shared volume which should be mounted to a folder in a dev container.

ide_flavour="$1"
# mounted volume path
ide_server_path="/idea-server"

# IDEA, if none is specified
if [ -z "$ide_flavour" ]; then
    ide_flavour="idea"
fi

# Download the IDE binaries and install them to the shared volume.
cd "$ide_server_path"
echo "Downloading IDE binaries..."
if [[ "$ide_flavour" == "idea" ]]; then
    curl -sL https://download-cdn.jetbrains.com/idea/ideaIU-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "webstorm" ]]; then
    curl -sL https://download-cdn.jetbrains.com/webstorm/WebStorm-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "pycharm" ]]; then
    curl -sL https://download-cdn.jetbrains.com/python/pycharm-professional-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "goland" ]]; then
    curl -sL https://download-cdn.jetbrains.com/go/goland-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "clion" ]]; then
    curl -sL https://download-cdn.jetbrains.com/cpp/CLion-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "phpstorm" ]]; then
    curl -sL https://download-cdn.jetbrains.com/webide/PhpStorm-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "rubymine" ]]; then
    curl -sL https://download-cdn.jetbrains.com/ruby/RubyMine-2024.2.tar.gz | tar xzf - --strip-components=1
elif [[ "$ide_flavour" == "rider" ]]; then
    curl -sL https://download-cdn.jetbrains.com/rider/JetBrains.Rider-2024.2.tar.gz | tar xzf - --strip-components=1
fi

cp -r /status-app/ "$ide_server_path"
cp /entrypoint-volume.sh "$ide_server_path"

# Copy Node.js to the editor volume,
# in case there is no one in the user's container.
cp /usr/bin/node "$ide_server_path"/node-ubi9
cp /node-ubi8 "$ide_server_path"/node-ubi8

echo "Volume content:"
ls -la "$ide_server_path"
