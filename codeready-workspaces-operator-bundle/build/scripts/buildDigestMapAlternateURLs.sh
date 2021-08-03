        tmpfile=$(mktemp)
        echo ${image} | sed -r \
            `# for plugin & devfile registries, use internal Brew versions` \
            -e "s|registry.redhat.io/codeready-workspaces/(pluginregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-\1|g" \
            -e "s|registry.redhat.io/codeready-workspaces/(devfileregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-\1|g" \
            `# in all other cases (including operator) use published quay images to compute digests` \
            -e "s|registry.redhat.io/codeready-workspaces/(.+)|quay.io/crw/\\1|g" \
            > ${tmpfile}
        alt_image=$(cat ${tmpfile})
        rm -f ${tmpfile}
        if [[ "${alt_image}" != "${image}" ]]; then
          if [[ ! "${QUIET}" ]]; then echo "[INFO] ${0##*/} :: + Get digest for ${alt_image} (${image})"; fi
          ARCH_OVERRIDE="" # optional override so that an image without amd64 won't return a failure when searching on amd64 arch machines
          if [[ ${image} == *"-openj9"* ]]; then
            ARCH_OVERRIDE="--override-arch s390x"
          fi
          digest="$(skopeo ${ARCH_OVERRIDE} inspect --tls-verify=false docker://${alt_image} 2>/dev/null | jq -r '.Digest')"
        fi
