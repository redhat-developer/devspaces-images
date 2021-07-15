#!/bin/bash
#
# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert che-operator olm files (csv, crd) to downstream using transforms

set -e
SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y
CSV_VERSION_PREV=2.x.0
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
OLM_CHANNEL="nightly" # or "stable", see https://github.com/eclipse-che/che-operator/tree/master/deploy/olm-catalog

SSO_TAG=7.4
UBI_TAG=8.4
POSTGRES_TAG=1

command -v yq >/dev/null 2>&1 || { echo "yq is not installed. Aborting."; exit 1; }
command -v skopeo >/dev/null 2>&1 || { echo "skopeo is not installed. Aborting."; exit 1; }
checkVersion() {
  if [[  "$1" = "$(echo -e "$1\n$2" | sort -V | head -n1)" ]]; then
    # echo "[INFO] $3 version $2 >= $1, can proceed."
	true
  else
    echo "[ERROR] Must install $3 version >= $1"
    exit 1
  fi
}
checkVersion 1.1 "$(skopeo --version | sed -e "s/skopeo version //")" skopeo

usage () {
	echo "Usage:   ${0##*/} -v [CRW CSV_VERSION] -p [CRW CSV_VERSION_PREV] -s [/path/to/sources] -t [/path/to/generated] [-b crw-repo-branch]"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) -b ${MIDSTM_BRANCH}"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) [if no che.version, use value from codeready-workspaces/crw-branch/pom.xml]"
	echo "Options:
	--sso-tag ${SSO_TAG}
	--ubi-tag ${UBI_TAG}
	--postgres-tag ${POSTGRES_TAG}
	"
	exit
}

if [[ $# -lt 8 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'--olm-channel') OLM_CHANNEL="$2"; shift 1;; # folder to use under https://github.com/eclipse-che/che-operator/tree/master/deploy/olm-catalog
    '-b'|'--crw-branch') MIDSTM_BRANCH="$2"; shift 1;; # branch of redhat-developer/codeready-workspaces from which to load plugin and devfile reg container refs
	# for CSV_VERSION = 2.2.0, get CRW_VERSION = 2.2
	'-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
	# previous version to set in CSV
	'-p') CSV_VERSION_PREV="$2"; shift 1;;
	# paths to use for input and ouput
	'-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
	'-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
	'--help'|'-h') usage;;
	# optional tag overrides
	'--crw-tag') CRW_VERSION="$2"; shift 1;;
	'--sso-tag') SSO_TAG="$2"; shift 1;;
	'--ubi-tag') UBI_TAG="$2"; shift 1;;
	'--postgres-tag') POSTGRES_TAG="$2"; shift 1;;
  esac
  shift 1
done

if [[ ! "${MIDSTM_BRANCH}" ]]; then usage; fi
if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi

# if current CSV and previous CVS version not set, die
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi
if [[ "${CSV_VERSION_PREV}" == "2.x.0" ]]; then usage; fi

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
CRW_RRIO="registry.redhat.io/codeready-workspaces"
CRW_OPERATOR="crw-2-rhel8-operator"
CRW_BROKER_METADATA_IMAGE="${CRW_RRIO}/pluginbroker-metadata-rhel8:${CRW_VERSION}"
CRW_BROKER_ARTIFACTS_IMAGE="${CRW_RRIO}/pluginbroker-artifacts-rhel8:${CRW_VERSION}"
CRW_CONFIGBUMP_IMAGE="${CRW_RRIO}/configbump-rhel8:${CRW_VERSION}"
CRW_DASHBOARD_IMAGE="${CRW_RRIO}/dashboard-rhel8:${CRW_VERSION}" 
CRW_DEVFILEREGISTRY_IMAGE="${CRW_RRIO}/devfileregistry-rhel8:${CRW_VERSION}"
CRW_DWO_IMAGE="${CRW_RRIO}/devworkspace-controller-rhel8:${CRW_VERSION}" 
CRW_DWCO_IMAGE="${CRW_RRIO}/devworkspace-rhel8:${CRW_VERSION}" 
CRW_JWTPROXY_IMAGE="${CRW_RRIO}/jwtproxy-rhel8:${CRW_VERSION}"
CRW_PLUGINREGISTRY_IMAGE="${CRW_RRIO}/pluginregistry-rhel8:${CRW_VERSION}"
CRW_SERVER_IMAGE="${CRW_RRIO}/server-rhel8:${CRW_VERSION}"
CRW_TRAEFIK_IMAGE="${CRW_RRIO}/traefik-rhel8:${CRW_VERSION}"

UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"
POSTGRES_IMAGE="registry.redhat.io/rhel8/postgresql-96:${POSTGRES_TAG}"
SSO_IMAGE="registry.redhat.io/rh-sso-7/sso74-openshift-rhel8:${SSO_TAG}" # and registry.redhat.io/rh-sso-7/sso74-openj9-openshift-rhel8 too

# header to reattach to yaml files after yq transform removes it
COPYRIGHT="#
#  Copyright (c) 2018-$(date +%Y) Red Hat, Inc.
#    This program and the accompanying materials are made
#    available under the terms of the Eclipse Public License 2.0
#    which is available at https://www.eclipse.org/legal/epl-2.0/
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Contributors:
#    Red Hat, Inc. - initial API and implementation
"

replaceField()
{
  theFile="$1"
  updateName="$2"
  updateVal="$3"
  header="$4"
  echo "[INFO] ${0##*/} rF :: * ${updateName}: ${updateVal}"
  # shellcheck disable=SC2016 disable=SC2002 disable=SC2086
  if [[ $updateVal == "DELETEME" ]]; then
	changed=$(cat "${theFile}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" 'del(${updateName})')
  else
	changed=$(cat "${theFile}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" ${updateName}' = $updateVal')
  fi
  echo "${header}${changed}" > "${theFile}"
}

# similar method to insertEnvVar() used in insert-related-images-to-csv.sh; uses += instead of =
replaceEnvVar()
{
	fileToChange="$1"
	header="$2"
	field="$3"
	# don't do anything if the existing value is the same as the replacement one
	# shellcheck disable=SC2016 disable=SC2002
	if [[ "$(cat "${fileToChange}" | yq -r --arg updateName "${updateName}" ${field}'[] | select(.name == $updateName).value')" != "${updateVal}" ]]; then
		echo "[INFO] ${0##*/} rEV :: ${fileToChange##*/} :: ${updateName}: ${updateVal}"
		if [[ $updateVal == "DELETEME" ]]; then
			changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" 'del('${field}'[]|select(.name == $updateName))')
			echo "${header}${changed}" > "${fileToChange}.2"
		else
			changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
${field}' = ['${field}'[] | if (.name == $updateName) then (.value = $updateVal) else . end]')
			echo "${header}${changed}" > "${fileToChange}.2"
			# echo "replaced?"
			# diff -u ${fileToChange} ${fileToChange}.2 || true
			if [[ ! $(diff -u "${fileToChange}" "${fileToChange}.2") ]]; then
				# echo "insert $updateName = $updateVal"
				changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
					${field}' += [{"name": $updateName, "value": $updateVal}]')
				echo "${header}${changed}" > "${fileToChange}.2"
			fi
		fi
		mv "${fileToChange}.2" "${fileToChange}"
	fi
}

pushd "${SOURCEDIR}" >/dev/null || exit

SOURCE_CSVFILE="${SOURCEDIR}/deploy/olm-catalog/${OLM_CHANNEL}/eclipse-che-preview-openshift/manifests/che-operator.clusterserviceversion.yaml"

ICON="$(cat "${SCRIPTS_DIR}/sync-che-olm-to-crw-olm.icon.txt")"
for CSVFILE in ${TARGETDIR}/manifests/codeready-workspaces.csv.yaml; do
	cp "${SOURCE_CSVFILE}" "${CSVFILE}"
	# transform resulting file
	NOW="$(date -u +%FT%T+00:00)"
	sed -r \
		-e 's|certified: "false"|certified: "true"|g' \
		-e "s|https://github.com/eclipse-che/che-operator|https://github.com/redhat-developer/codeready-workspaces-operator/|g" \
		-e "s|https://github.com/eclipse/che-operator|https://github.com/redhat-developer/codeready-workspaces-operator/|g" \
		-e "s|url: https*://www.eclipse.org/che/docs|url: https://access.redhat.com/documentation/en-us/red_hat_codeready_workspaces|g" \
		-e "s|url: https*://www.eclipse.org/che|url: https://developers.redhat.com/products/codeready-workspaces/overview/|g" \
		\
		-e 's|"eclipse-che"|"codeready-workspaces"|g' \
		-e 's|che-operator|codeready-operator|g' \
		-e "s|Eclipse Che|CodeReady Workspaces|g" \
		-e "s|Eclipse Foundation|Red Hat, Inc.|g" \
		\
		-e "s|name: .+preview-openshift.v.+|name: crwoperator.v${CSV_VERSION}|g" \
		\
		-e 's|Keycloak|Red Hat SSO|g' \
		-e 's|my-keycloak|my-rhsso|' \
		\
		-e "s|    - base64data: .+|${ICON}|" \
		-e "s|createdAt:.+|createdAt: \"${NOW}\"|" \
		\
		-e 's|email: dfestal@redhat.com|email: nboldt@redhat.com|' \
		-e 's|name: David Festal|name: Nick Boldt|' \
		-e 's@((name|support): Red Hat), Inc.@\1@g' \
		\
		-e 's|/usr/local/bin/codeready-operator|/usr/local/bin/che-operator|' \
		-e 's|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|' \
		`# -e "s|replaces: eclipse-che-preview-openshift.v.+|replaces: crwoperator.v${CSV_VERSION_PREV}|"` \
		`# -e "s|version: .+nightly|version: ${CSV_VERSION}|g"` \
		\
		-e 's|"cheImageTag": "nightly"|"cheImageTag": ""|' \
		-e 's|"devfileRegistryImage":.".+"|"devfileRegistryImage": ""|' \
		-e 's|"pluginRegistryImage":.".+"|"pluginRegistryImage": ""|' \
		-e 's|"identityProviderImage":.".+"|"identityProviderImage": ""|' \
		-e 's|"workspaceNamespaceDefault":.".*"|"workspaceNamespaceDefault": "<username>-codeready"|' \
		\
		-e "s|quay.io/eclipse/codeready-operator:.+|registry.redhat.io/codeready-workspaces/${CRW_OPERATOR}:${CRW_VERSION}|" \
		-e "s|(registry.redhat.io/codeready-workspaces/${CRW_OPERATOR}:${CRW_VERSION}).+|\1|" \
		-e "s|quay.io/eclipse/che-server:.+|registry.redhat.io/codeready-workspaces/server-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-plugin-registry:.+|registry.redhat.io/codeready-workspaces/pluginregistry-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-devfile-registry:.+|registry.redhat.io/codeready-workspaces/devfileregistry-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-plugin-metadata-broker:.+|registry.redhat.io/codeready-workspaces/pluginbroker-metadata-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-plugin-artifacts-broker:.+|registry.redhat.io/codeready-workspaces/pluginbroker-artifacts-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-jwtproxy:.+|registry.redhat.io/codeready-workspaces/jwtproxy-rhel8:${CRW_VERSION}|" \
		\
		`# CRW-1254 use ubi8/ubi-minimal for airgap mirroring` \
		-e "s|/ubi8-minimal|/ubi8/ubi-minimal|g" \
		-e "s|registry.redhat.io/ubi8/ubi-minimal:.+|${UBI_IMAGE}|" \
		-e "s|registry.access.redhat.com/ubi8/ubi-minimal:.+|${UBI_IMAGE}|g" \
		\
		-e "s|centos/postgresql-96-centos7:9.6|${POSTGRES_IMAGE}|" \
		-e "s|quay.io/eclipse/che--centos--postgresql-96-centos7.+|${POSTGRES_IMAGE}|" \
		-e "s|quay.io/eclipse/che-keycloak:.+|${SSO_IMAGE}|" \
		\
		`# use internal image for operator, as codeready-workspaces-crw-2-rhel8-operator only exists in RHEC and Quay repos` \
		-e "s#quay.io/eclipse/codeready-operator:.+#registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-operator:${CRW_VERSION}#" \
		-e 's|IMAGE_default_|RELATED_IMAGE_|' \
		\
		` # CRW-927 set suggested namespace, append cluster-monitoring = true (removed from upstream as not supported in community operators)` \
		-e '/operatorframework.io\/cluster-monitoring:/d' \
		-e 's|operatorframework.io/suggested-namespace: .+|operatorframework.io/suggested-namespace: openshift-workspaces|' \
		-e '/operatorframework.io\/suggested-namespace/a \ \ \ \ operatorframework.io/cluster-monitoring: "true"' \
		-e '/annotations\:/i \ \ labels:\n    operatorframework.io/arch.amd64\: supported\n    operatorframework.io/arch.ppc64le\: supported\n    operatorframework.io/arch.s390x\: supported' \
		-e 's|devworkspace-codeready-operator|devworkspace-che-operator|' \
		-i "${CSVFILE}"
	# insert missing cheFlavor annotation
	if [[ ! $(grep -E '"cheFlavor": "codeready",' "${CSVFILE}") ]]; then
		sed 's|"cheFlavor":.*|"cheFlavor": "codeready",|' -i "${CSVFILE}"
	fi
	if [[ $(diff -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "[INFO] ${0##*/} :: Converted (sed) ${CSVFILE}"
	fi

	##### update the first container yaml

	# yq changes - transform env vars from Che to CRW values
	changed="$(cat "${CSVFILE}" | yq  -Y '.spec.displayName="Red Hat CodeReady Workspaces"')" && \
		echo "${changed}" > "${CSVFILE}"
	if [[ $(diff -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "[INFO] ${0##*/} :: Converted (yq #1) ${CSVFILE}:"
		for updateName in ".spec.displayName"; do
			echo -n "[INFO] ${0##*/} ::  * $updateName: "
			cat  "${CSVFILE}" | yq "${updateName}" 2>/dev/null
		done
	fi

	# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
	# yq changes - transform env vars from Che to CRW values
	declare -A operator_replacements=(
		["CHE_VERSION"]="${CSV_VERSION}" # set this to x.y.z version, matching the CSV
		["CHE_FLAVOR"]="codeready"
		["CONSOLE_LINK_NAME"]="che" # use che, not workspaces - CRW-1078

		["RELATED_IMAGE_che_server"]="${CRW_SERVER_IMAGE}"
		["RELATED_IMAGE_dashboard"]="${CRW_DASHBOARD_IMAGE}"
		["RELATED_IMAGE_devfile_registry"]="${CRW_DEVFILEREGISTRY_IMAGE}"
		["RELATED_IMAGE_devworkspace_che_operator"]="${CRW_DWCO_IMAGE}"
		["RELATED_IMAGE_devworkspace_controller"]="${CRW_DWO_IMAGE}"
		["RELATED_IMAGE_plugin_registry"]="${CRW_PLUGINREGISTRY_IMAGE}"

		["RELATED_IMAGE_che_workspace_plugin_broker_metadata"]="${CRW_BROKER_METADATA_IMAGE}"
		["RELATED_IMAGE_che_workspace_plugin_broker_artifacts"]="${CRW_BROKER_ARTIFACTS_IMAGE}"
		["RELATED_IMAGE_che_server_secure_exposer_jwt_proxy_image"]="${CRW_JWTPROXY_IMAGE}"

		["RELATED_IMAGE_single_host_gateway"]="${CRW_TRAEFIK_IMAGE}"
		["RELATED_IMAGE_single_host_gateway_config_sidecar"]="${CRW_CONFIGBUMP_IMAGE}"

		["RELATED_IMAGE_pvc_jobs"]="${UBI_IMAGE}"
		["RELATED_IMAGE_postgres"]="${POSTGRES_IMAGE}"
		["RELATED_IMAGE_keycloak"]="${SSO_IMAGE}"

		# remove env vars using DELETEME keyword
		["RELATED_IMAGE_che_tls_secrets_creation_job"]="DELETEME"
		["RELATED_IMAGE_internal_rest_backup_server"]="DELETEME"
		["RELATED_IMAGE_gateway_authentication_sidecar"]="DELETEME"
		["RELATED_IMAGE_gateway_authorization_sidecar"]="DELETEME"
		["RELATED_IMAGE_gateway_header_sidecar"]="DELETEME"
	)
	for updateName in "${!operator_replacements[@]}"; do
		updateVal="${operator_replacements[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env'
	done

	# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
	# insert keycloak image references for s390x and ppc64le
	declare -A operator_insertions=(
		["RELATED_IMAGE_keycloak_s390x"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
		["RELATED_IMAGE_keycloak_ppc64le"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
	)
	for updateName in "${!operator_insertions[@]}"; do
		updateVal="${operator_insertions[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env'
	done

	# insert replaces: field
	declare -A spec_insertions=(
		[".spec.replaces"]="crwoperator.v${CSV_VERSION_PREV}"
		[".spec.version"]="${CSV_VERSION}"
	)
	for updateName in "${!spec_insertions[@]}"; do
		updateVal="${spec_insertions[$updateName]}"
		replaceField "${CSVFILE}" "${updateName}" "${updateVal}" "${COPYRIGHT}"
	done

	##### update the second container yaml

	declare -A operator_replacements2=(
		["RELATED_IMAGE_gateway"]="${CRW_TRAEFIK_IMAGE}"
		["RELATED_IMAGE_gateway_configurer"]="${CRW_CONFIGBUMP_IMAGE}"
	)
	for updateName in "${!operator_replacements2[@]}"; do
		updateVal="${operator_replacements2[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[1].env'
	done

	# update second container image from quay.io/che-incubator/devworkspace-che-operator:ci to CRW_DWCO_IMAGE
	replaceField "${CSVFILE}" '.spec.install.spec.deployments[].spec.template.spec.containers[1].image' "${CRW_DWCO_IMAGE}" "${COPYRIGHT}"
	# add more RELATED_IMAGE_ fields for the images referenced by the registries
	${SCRIPTS_DIR}/insert-related-images-to-csv.sh -v ${CSV_VERSION} -t ${TARGETDIR} --crw-branch ${MIDSTM_BRANCH}

	# echo "[INFO] ${0##*/} :: Sort env var in ${CSVFILE}:"
	cat "${CSVFILE}" | yq -Y '.spec.install.spec.deployments[].spec.template.spec.containers[0].env |= sort_by(.name)' > "${CSVFILE}.2"
	cat "${CSVFILE}.2" | yq -Y '.spec.install.spec.deployments[].spec.template.spec.containers[1].env |= sort_by(.name)' > "${CSVFILE}"
	echo "${COPYRIGHT}$(cat "${CSVFILE}")" > "${CSVFILE}.2"
	mv "${CSVFILE}.2" "${CSVFILE}" 

	if [[ $(diff -q -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "[INFO] ${0##*/} :: Converted + inserted (yq #2) ${CSVFILE}:"
		for updateName in "${!operator_replacements[@]}"; do
			echo -n " * $updateName: "
			cat "${CSVFILE}" | yq --arg updateName "${updateName}" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env? | .[] | select(.name == $updateName) | .value' 2>/dev/null
		done
	fi
done

	# simple copy - old way CRW 2.8
	# mkdir -p ${TARGETDIR}/deploy/crds ${TARGETDIR}/manifests/
	# for CRDFILE in \
	# 	"${TARGETDIR}/manifests/codeready-workspaces.crd.yaml" \
	# 	"${TARGETDIR}/deploy/crds/org_v1_che_crd.yaml"; do
	# 	cp "${SOURCEDIR}"/deploy/olm-catalog/${OLM_CHANNEL}/eclipse-che-preview-openshift/manifests/*crd.yaml "${CRDFILE}"
	# done

	# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
	# yq changes - transform env vars from Che to CRW values
	while IFS= read -r -d '' d; do
		changed="$(cat "${TARGETDIR}/${d}" | \
yq  -y '.spec.server.devfileRegistryImage=""|.spec.server.pluginRegistryImage=""' | \
yq  -y '.spec.server.cheFlavor="codeready"' | \
yq  -y '.spec.server.workspaceNamespaceDefault="<username>-codeready"' | \
yq  -y '.spec.storage.pvcStrategy="per-workspace"' | \
yq  -y '.spec.auth.identityProviderAdminUserName="admin"|.spec.auth.identityProviderImage=""' | \
yq  -y 'del(.spec.k8s)')" && \
		echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${d}"
		if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
			echo "Converted (yq #3) ${d}"
		fi
	done <   <(find deploy/crds -type f -name "org_v1_che_cr.yaml" -print0)
	cp "${TARGETDIR}/deploy/crds/org_v1_che_crd.yaml" "${TARGETDIR}/manifests/codeready-workspaces.crd.yaml"

popd >/dev/null || exit
