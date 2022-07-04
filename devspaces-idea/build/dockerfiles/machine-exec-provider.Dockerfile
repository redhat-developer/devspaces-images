FROM quay.io/devspaces/machineexec-rhel8:3.2 as machine-exec

FROM registry.access.redhat.com/ubi8/ubi-micro:8.5-744
COPY --from=machine-exec --chown=0:0 /go/bin/che-machine-exec /exec/machine-exec
