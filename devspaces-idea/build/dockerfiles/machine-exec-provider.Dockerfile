FROM quay.io/devspaces/machineexec-rhel8:3.11 as machine-exec

# https://registry.access.redhat.com/ubi8/ubi-micro
FROM registry.access.redhat.com/ubi8/ubi-micro:8.9-4
COPY --from=machine-exec --chown=0:0 /go/bin/che-machine-exec /exec/machine-exec
