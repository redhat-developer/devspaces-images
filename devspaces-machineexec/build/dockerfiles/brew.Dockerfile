
ENV SUMMARY="Red Hat OpenShift Dev Spaces machineexec container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces machineexec container" \
    PRODNAME="devspaces" \
    COMPNAME="machineexec-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.6" \
      license="EPLv2" \
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
