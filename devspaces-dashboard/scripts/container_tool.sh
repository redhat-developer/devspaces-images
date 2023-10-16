#!/bin/bash

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
if command_exists "docker"; then
    # Check if Docker daemon is running
    if docker info &>/dev/null; then
        container_engine="docker"
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
    container_tool "$@"
    ;;
*)
    echo "Unknown command. Use: build, run, or push."
    exit 1
    ;;
esac

exit 0
