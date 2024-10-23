#!/bin/sh
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Function to check if a command is available
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Podman
if command_exists "podman"; then
    # Check if Podman machine is running
    if podman info &>/dev/null; then
        container_engine="podman"
    fi
fi

# Check for Docker
if [ -z "$container_engine" ]; then
    if command_exists "docker"; then
        # Check if Docker daemon is running
        if docker info &>/dev/null; then
            container_engine="docker"
        fi
    fi
fi

# If neither Podman nor Docker is found or running
if [ -z "$container_engine" ]; then
    echo "Neither Podman nor Docker is installed or running."
    exit 1
fi

# Run command using Docker or Podman whichever is available
container_tool() {
    local command=$1
    shift

    echo "Container engine: $container_engine"
    "$container_engine" "$command" "$@"
}

# Main script
case "$1" in
build | run | push)
    set -e
    container_tool "$@"
    ;;
*)
    echo "Unknown command. Use: build, run, or push."
    exit 1
    ;;
esac

exit 0
