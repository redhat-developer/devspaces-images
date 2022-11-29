#!/bin/bash
#
# generate fetch-artifacts-url.yaml

e2fsprogs_VERSION=1.45.6-5.el8
DLBR="https://download.devel.redhat.com/brewroot/packages"
SIG="/data/signed/fd431d51/"
yaml="fetch-artifacts-url.yaml"
rm -f $yaml

for d in e2fsprogs; do 
    for a in src; do
        echo "$a: ${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}${a}/${d}-${e2fsprogs_VERSION}.${a}.rpm"
        curl -sSLkO "${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}${a}/${d}-${e2fsprogs_VERSION}.${a}.rpm"
    done
done
for d in e2fsprogs e2fsprogs-libs; do 
    for a in x86_64 ppc64le s390x; do 
        echo "$a: ${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}${a}/${d}-${e2fsprogs_VERSION}.${a}.rpm"
        curl -sSLkO "${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}${a}/${d}-${e2fsprogs_VERSION}.${a}.rpm"

        echo "- url: ${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}${a}/${d}-${e2fsprogs_VERSION}.${a}.rpm" >> $yaml
        echo -n "  sha256: " >> $yaml; sha256sum $d-${e2fsprogs_VERSION}.${a}.rpm|cut -f 1 -d " " >> $yaml
        echo "  source-url: ${DLBR}/e2fsprogs/${e2fsprogs_VERSION/-/\/}${SIG}src/e2fsprogs-${e2fsprogs_VERSION}.src.rpm" >> $yaml 
        echo -n "  source-sha256: "  >> $yaml; sha256sum e2fsprogs-${e2fsprogs_VERSION}.src.rpm|cut -f 1 -d " " >> $yaml
    done
done
