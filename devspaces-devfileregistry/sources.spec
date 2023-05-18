#
# workaround for CRW-4328 and broken rhpkg release -- add a .spec file (that will be ignored)
#
Summary: This is a dirty hack for https://issues.redhat.com/browse/CRW-4328 and https://pagure.io/rpkg/issue/684
Name: hackaround
Version: 1.0
Release: 1
License: EPL
Group: Applications/Hacks
Source: https://github.com/redhat-developer/devspaces-images/
URL: https://github.com/redhat-developer/devspaces-images/
Distribution: Red Hat
Vendor: Red Hat
%description
This is a dirty hack for https://issues.redhat.com/browse/CRW-4328 and https://pagure.io/rpkg/issue/684

# workaround for https://issues.redhat.com/browse/CRW-4378 - must list all the files already in the sources file, because reasons.
Source001: root-local.tgz
Source002: resources.tgz
