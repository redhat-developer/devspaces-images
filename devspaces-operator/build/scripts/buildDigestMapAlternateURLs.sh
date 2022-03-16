        tmpfile=$(mktemp)
        echo ${image} | sed -r \
            `# for plugin & devfile registries, use internal Brew versions` \
            -e "s|registry.redhat.io/devspaces/(pluginregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/devspaces-\1|g" \
            -e "s|registry.redhat.io/devspaces/(devfileregistry-rhel8:.+)|registry-proxy.engineering.redhat.com/rh-osbs/devspaces-\1|g" \
            `# in all other cases (including operator) use published quay images to compute digests` \
            -e "s|registry.redhat.io/devspaces/(.+)|quay.io/crw/\\1|g" \
            > ${tmpfile}
        alt_image=$(cat ${tmpfile})
        rm -f ${tmpfile}
        if [[ "${alt_image}" != "${image}" ]]; then
          if [[ ! "${QUIET}" ]]; then echo "[INFO] ${0##*/} :: + Get digest for ${alt_image} (${image})"; fi
          digest="$(skopeo inspect --tls-verify=false docker://${alt_image} 2>/dev/null | jq -r '.Digest')"
        fi
