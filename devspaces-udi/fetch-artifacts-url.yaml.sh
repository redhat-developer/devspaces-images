#!/bin/bash
#
# generate fetch-artifacts-url.yaml

e2fsprogs_VERSION=1.45.6-5.el8
maven_VERSION=3.8.5-3.module+el9.1.0+16330+91eb0817
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

for d in maven; do 
    for a in src; do 
        echo "$a: ${DLBR}/maven/${maven_VERSION/-/\/}${SIG}${a}/${d}-${maven_VERSION}.${a}.rpm"
        curl -sSLkO "${DLBR}/maven/${maven_VERSION/-/\/}${SIG}${a}/${d}-${maven_VERSION}.${a}.rpm"
    done
done
for d in maven maven-lib maven-openjdk8 maven-openjdk11 maven-openjdk17; do 
    for a in noarch; do 
        echo "$a: ${DLBR}/maven/${maven_VERSION/-/\/}${SIG}${a}/${d}-${maven_VERSION}.${a}.rpm"
        curl -sSLkO "${DLBR}/maven/${maven_VERSION/-/\/}${SIG}${a}/${d}-${maven_VERSION}.${a}.rpm"

        echo "- url: ${DLBR}/maven/${maven_VERSION/-/\/}${SIG}${a}/${d}-${maven_VERSION}.${a}.rpm" >> $yaml
        echo -n "  sha256: " >> $yaml; sha256sum $d-${maven_VERSION}.${a}.rpm|cut -f 1 -d " " >> $yaml
        echo "  source-url: ${DLBR}/maven/${maven_VERSION/-/\/}${SIG}src/maven-${maven_VERSION}.src.rpm" >> $yaml
        echo -n "  source-sha256: " >> $yaml; sha256sum maven-${maven_VERSION}.src.rpm|cut -f 1 -d " " >> $yaml
    done
done
