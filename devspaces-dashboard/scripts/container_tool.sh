#!/bin/bash

# check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        return 0 # not found
    else
        return 1 # found
    fi
}

# Run command using Docker or Podman whichever is available
container_tool() {
    local command=$1
    shift

    if check_command "docker"; then
        CONTAINER_TOOL="docker"
    elif check_command "podman"; then
        CONTAINER_TOOL="podman"
    else
        echo "Error: Docker or Podman not found on the system."
        exit 1
    fi

    "$CONTAINER_TOOL" "$command" "$@"
}

# Main script
case "$1" in
    build|run|push)
        container_tool "$@"
        ;;
    *)
        echo "Uknown command. Use: build, run or push."
        exit 1
        ;;
esac

exit 0
