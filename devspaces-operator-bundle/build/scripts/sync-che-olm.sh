#!/bin/bash
#
# Copyright (c) 2021-22 Red Hat, Inc.
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
CSV_VERSION=3.y.0 # csv 3.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 3.y
CSV_VERSION_PREV=3.x.0
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
OLM_CHANNEL="next" # or "stable", see https://github.com/eclipse-che/che-operator/tree/main/bundle
DWO_TAG=0.13
UBI_TAG=8.5
POSTGRES_TAG=1
POSTGRES13_TAG=1 # use 1-26.1638356747 to pin to postgre 13.3, or 1 to use 13.x
OPENSHIFT_TAG="v4.8"

command -v yq >/dev/null 2>&1 || { echo "yq is not installed. Aborting."; exit 1; }
command -v skopeo >/dev/null 2>&1 || { echo "skopeo is not installed. Aborting."; exit 1; }
checkVersion() {
  if [[  "$1" = "$(echo -e "$1\n$2" | sort -V | head -n1)" ]]; then
    # echo "    $3 version $2 >= $1, can proceed."
	true
  else
    echo "[ERROR] Must install $3 version >= $1"
    exit 1
  fi
}
checkVersion 1.1 "$(skopeo --version | sed -e "s/skopeo version //")" skopeo

usage () {
	echo "Usage:   ${0##*/} -v [CRW CSV_VERSION] -p [CRW CSV_VERSION_PREV] -s [/path/to/sources] -t [/path/to/generated] [-b devspaces-repo-branch]"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) -b ${MIDSTM_BRANCH}"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) [if no che.version, use value from devspaces/devspaces-branch/pom.xml]"
	echo "Options:
	--crw-tag ${CRW_VERSION}
	--dwo-tag ${DWO_TAG}
	--ubi-tag ${UBI_TAG}
	--postgres-tag ${POSTGRES_TAG}
	--postgres13-tag ${POSTGRES13_TAG}
	--openshift-tag ${OPENSHIFT_TAG}
	"
	exit
}

if [[ $# -lt 8 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'--olm-channel') OLM_CHANNEL="$2"; shift 1;; # folder to use under https://github.com/eclipse-che/che-operator/tree/main/bundle
    '-b'|'--crw-branch') MIDSTM_BRANCH="$2"; shift 1;; # branch of redhat-developer/devspaces from which to load plugin and devfile reg container refs
	# for CSV_VERSION = 3.2.0, get CRW_VERSION = 3.2
	'-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
	# previous version to set in CSV
	'-p') CSV_VERSION_PREV="$2"; shift 1;;
	# paths to use for input and ouput
	'-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
	'-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
	'--help'|'-h') usage;;
	# optional tag overrides
	'--crw-tag') CRW_VERSION="$2"; shift 1;;
	'--dwo-tag') DWO_TAG="$2"; shift 1;;
	'--ubi-tag') UBI_TAG="$2"; shift 1;;
	'--postgres-tag') POSTGRES_TAG="$2"; shift 1;; # for deprecated 9.6 
	'--postgres13-tag') POSTGRES13_TAG="$2"; shift 1;; # for 13 (@since CRW 2.14)
	'--openshift-tag') OPENSHIFT_TAG="$2"; shift 1;;
  esac
  shift 1
done

if [[ ! "${MIDSTM_BRANCH}" ]]; then usage; fi
if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi

# if current CSV and previous CVS version not set, die
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi
if [[ "${CSV_VERSION_PREV}" == "3.x.0" ]]; then usage; fi

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
CRW_RRIO="registry.redhat.io/devspaces"
CRW_OPERATOR="devspaces-rhel8-operator"
CRW_CONFIGBUMP_IMAGE="${CRW_RRIO}/configbump-rhel8:${CRW_VERSION}"
CRW_DASHBOARD_IMAGE="${CRW_RRIO}/dashboard-rhel8:${CRW_VERSION}"
CRW_DEVFILEREGISTRY_IMAGE="${CRW_RRIO}/devfileregistry-rhel8:${CRW_VERSION}"
DWO_IMAGE="registry.redhat.io/devworkspace/devworkspace-rhel8-operator:${DWO_TAG}"
CRW_PLUGINREGISTRY_IMAGE="${CRW_RRIO}/pluginregistry-rhel8:${CRW_VERSION}"
CRW_SERVER_IMAGE="${CRW_RRIO}/server-rhel8:${CRW_VERSION}"
CRW_TRAEFIK_IMAGE="${CRW_RRIO}/traefik-rhel8:${CRW_VERSION}"

UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"
POSTGRES_IMAGE="registry.redhat.io/rhel8/postgresql-96:${POSTGRES_TAG}"
POSTGRES13_IMAGE="registry.redhat.io/rhel8/postgresql-13:${POSTGRES13_TAG}"
RBAC_PROXY_IMAGE="registry.redhat.io/openshift4/ose-kube-rbac-proxy:${OPENSHIFT_TAG}"
OAUTH_PROXY_IMAGE="registry.redhat.io/openshift4/ose-oauth-proxy:${OPENSHIFT_TAG}"

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
  echo "    ${0##*/} rF :: * ${updateName}: ${updateVal}"
  # shellcheck disable=SC2016 disable=SC2002 disable=SC2086
  if [[ $updateVal == "DELETEME" ]]; then
	changed=$(yq -Y --arg updateName "${updateName}" 'del('${updateName}')' "${theFile}")
  else
	changed=$(yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" ${updateName}' = $updateVal' "${theFile}")
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
	# shellcheck disable=SC2016 disable=SC2002 disable=SC2086
	if [[ $(yq -r $field "${fileToChange}") == "null" ]]; then
		echo "Error: could not find $field in $fileToChange"; exit 1
	fi
	# shellcheck disable=SC2016 disable=SC2002 disable=SC2086
	if [[ "$(cat "${fileToChange}" | yq -r --arg updateName "${updateName}" ${field}'[] | select(.name == $updateName).value')" != "${updateVal}" ]]; then
		echo "    ${0##*/} rEV :: ${fileToChange##*/} :: ${updateName}: ${updateVal}"
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

SOURCE_CSVFILE="${SOURCEDIR}/bundle/${OLM_CHANNEL}/eclipse-che-preview-openshift/manifests/che-operator.clusterserviceversion.yaml"

ICON="    - base64data: $(base64 "${SCRIPTS_DIR}/../icon.png" | tr -d '\n\r')" # echo $ICON
for CSVFILE in ${TARGETDIR}/manifests/devspaces.csv.yaml; do
	cp "${SOURCE_CSVFILE}" "${CSVFILE}"
	# transform resulting file
	NOW="$(date -u +%FT%T+00:00)"
	# add subscription metadata https://issues.redhat.com/browse/CRW-2841
	subscriptions="    operators.openshift.io/valid-subscription: '[\"OpenShift Container Platform\", \"OpenShift Platform Plus\"]'"
	sed -r \
		-e 's|certified: "false"|certified: "true"|g' \
		-e "s|https://github.com/eclipse-che/che-operator|https://github.com/redhat-developer/devspaces-images/|g" \
		-e "s|https://github.com/eclipse/che-operator|https://github.com/redhat-developer/devspaces-images/|g" \
		-e "s|url: https*://www.eclipse.org/che/docs|url: https://access.redhat.com/documentation/en-us/red_hat_openshift_dev_spaces|g" \
		-e "s|url: https*://www.eclipse.org/che|url: https://developers.redhat.com/products/devspaces/overview/|g" \
		\
		-e 's|"eclipse-che"|"devspaces"|g' \
		-e 's|che-operator|devspaces-operator|g' \
		-e "s|Eclipse Che|Red Hat OpenShift Dev Spaces|g" \
		-e "s|Eclipse Foundation|Red Hat, Inc.|g" \
		\
		-e "s|name: .+preview-openshift.v.+|name: devspacesoperator.v${CSV_VERSION}|g" \
		\
		\
		-e "s|    - base64data: .+|${ICON}|" \
		-e "s|createdAt:.+|createdAt: \"${NOW}\"|" \
		\
		-e 's|email: dfestal@redhat.com|email: nboldt@redhat.com|' \
		-e 's|name: David Festal|name: Nick Boldt|' \
		-e 's@((name|support): Red Hat), Inc.@\1@g' \
		\
		-e 's|/usr/local/bin/devspaces-operator|/usr/local/bin/che-operator|' \
		-e 's|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|' \
		\
		-e 's|"cheImageTag": "next"|"cheImageTag": ""|' \
		-e 's|"devfileRegistryImage":.".+"|"devfileRegistryImage": ""|' \
		-e 's|"pluginRegistryImage":.".+"|"pluginRegistryImage": ""|' \
		-e 's|"identityProviderImage":.".+"|"identityProviderImage": ""|' \
		-e 's|"workspaceNamespaceDefault":.".*"|"workspaceNamespaceDefault": "<username>-devspaces"|' \
		\
		-e "s|quay.io/eclipse/devspaces-operator:.+|registry.redhat.io/devspaces/${CRW_OPERATOR}:${CRW_VERSION}|" \
		-e "s|(registry.redhat.io/devspaces/${CRW_OPERATOR}:${CRW_VERSION}).+|\1|" \
		-e "s|quay.io/eclipse/che-server:.+|registry.redhat.io/devspaces/server-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-plugin-registry:.+|registry.redhat.io/devspaces/pluginregistry-rhel8:${CRW_VERSION}|" \
		-e "s|quay.io/eclipse/che-devfile-registry:.+|registry.redhat.io/devspaces/devfileregistry-rhel8:${CRW_VERSION}|" \
		\
		`# CRW-1254 use ubi8/ubi-minimal for airgap mirroring` \
		-e "s|/ubi8-minimal|/ubi8/ubi-minimal|g" \
		-e "s|registry.redhat.io/ubi8/ubi-minimal:.+|${UBI_IMAGE}|" \
		-e "s|registry.access.redhat.com/ubi8/ubi-minimal:.+|${UBI_IMAGE}|g" \
		\
		-e "s|centos/postgresql-96-centos7:9.6|${POSTGRES_IMAGE}|" \
		-e "s|quay.io/eclipse/che--centos--postgresql-96-centos7.+|${POSTGRES_IMAGE}|" \
		\
		`# use internal image for operator, as devspaces-operator only exists in RHEC and Quay repos` \
		-e "s#quay.io/eclipse/devspaces-operator:.+#registry-proxy.engineering.redhat.com/rh-osbs/devspaces-operator:${CRW_VERSION}#" \
		-e 's|IMAGE_default_|RELATED_IMAGE_|' \
		\
		` # CRW-927 set suggested namespace, append cluster-monitoring = true (removed from upstream as not supported in community operators)` \
		-e '/operatorframework.io\/cluster-monitoring:/d' \
		-e 's|operatorframework.io/suggested-namespace: .+|operatorframework.io/suggested-namespace: openshift-operators|' \
		-e '/operatorframework.io\/suggested-namespace/a \ \ \ \ operatorframework.io/cluster-monitoring: "true"\n'"$subscriptions" \
		-e '/annotations\:/i \ \ labels:\n    operatorframework.io/arch.amd64\: supported\n    operatorframework.io/arch.ppc64le\: supported\n    operatorframework.io/arch.s390x\: supported' \
		-e 's|devworkspace-devspaces-operator|devworkspace-che-operator|' \
		-i "${CSVFILE}"
	# insert missing cheFlavor annotation
	# shellcheck disable=SC2143
	if [[ ! $(grep -E '"cheFlavor": "devspaces",' "${CSVFILE}") ]]; then
		sed 's|"cheFlavor":.*|"cheFlavor": "devspaces",|' -i "${CSVFILE}"
	fi
	if [[ $(diff -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "    ${0##*/} :: Converted (sed) ${CSVFILE}"
	fi

	# Change the install Mode to AllNamespaces by default
	yq -Yi '.spec.installModes[] |= if .type=="OwnNamespace" then .supported |= false else . end' "${CSVFILE}"
	yq -Yi '.spec.installModes[] |= if .type=="SingleNamespace" then .supported |= false else . end' "${CSVFILE}"
	yq -Yi '.spec.installModes[] |= if .type=="MultiNamespace" then .supported |= false else . end' "${CSVFILE}"
	yq -Yi '.spec.installModes[] |= if .type=="AllNamespaces" then .supported |= true else . end' "${CSVFILE}"

	# Enable by default devWorkspace engine in `stable`
	CSV_CR_SAMPLES=$(yq -r ".metadata.annotations[\"alm-examples\"] | \
			fromjson | \
			( .[] | select(.kind == \"CheCluster\") | .spec.devWorkspace.enable) |= true" ${CSVFILE} |  sed -r 's/"/\\"/g')
	yq -riY ".metadata.annotations[\"alm-examples\"] = \"${CSV_CR_SAMPLES}\"" ${CSVFILE}

	# yq changes - transform env vars from Che to CRW values
	changed="$(yq  -Y '.spec.displayName="Red Hat OpenShift Dev Spaces"' "${CSVFILE}")" && \
		echo "${changed}" > "${CSVFILE}"
	if [[ $(diff -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "    ${0##*/} :: Converted (yq #1) ${CSVFILE}:"
		echo -n "    ${0##*/} ::  * .spec.displayName: "
		yq '.spec.displayName' "${CSVFILE}" 2>/dev/null
	fi

	# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
	# yq changes - transform env vars from Che to CRW values
	declare -A operator_replacements=(
		["CHE_VERSION"]="${CSV_VERSION}" # set this to x.y.z version, matching the CSV
		["CHE_FLAVOR"]="devspaces"
		["CONSOLE_LINK_NAME"]="che" # use che, not workspaces - CRW-1078

		["RELATED_IMAGE_che_server"]="${CRW_SERVER_IMAGE}"
		["RELATED_IMAGE_dashboard"]="${CRW_DASHBOARD_IMAGE}"
		["RELATED_IMAGE_devfile_registry"]="${CRW_DEVFILEREGISTRY_IMAGE}"
		["RELATED_IMAGE_devworkspace_controller"]="${DWO_IMAGE}"
		["RELATED_IMAGE_plugin_registry"]="${CRW_PLUGINREGISTRY_IMAGE}"

		["RELATED_IMAGE_single_host_gateway"]="${CRW_TRAEFIK_IMAGE}"
		["RELATED_IMAGE_single_host_gateway_config_sidecar"]="${CRW_CONFIGBUMP_IMAGE}"
		["RELATED_IMAGE_internal_rest_backup_server"]="DELETEME"

		["RELATED_IMAGE_pvc_jobs"]="${UBI_IMAGE}"
		["RELATED_IMAGE_postgres"]="${POSTGRES_IMAGE}" # deprecated @since 2.13
		["RELATED_IMAGE_postgres_13_3"]="${POSTGRES13_IMAGE}" # CRW-2180 - new @since 2.13
	
		# CRW-2303 - @since 2.12 DWO only (but needs to be available even on non-DWO installs)
		["RELATED_IMAGE_gateway_authentication_sidecar"]="${OAUTH_PROXY_IMAGE}"
		["RELATED_IMAGE_gateway_authorization_sidecar"]="${RBAC_PROXY_IMAGE}"

		# remove env vars using DELETEME keyword
		["RELATED_IMAGE_gateway_authentication_sidecar_k8s"]="DELETEME"
		["RELATED_IMAGE_gateway_authorization_sidecar_k8s"]="DELETEME"
		["RELATED_IMAGE_che_tls_secrets_creation_job"]="DELETEME"
		["RELATED_IMAGE_gateway_header_sidecar"]="DELETEME"
	)
	for updateName in "${!operator_replacements[@]}"; do
		updateVal="${operator_replacements[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env'
	done
	echo "Converted (yq #2) ${CSVFILE}"

	# insert replaces: field
	declare -A spec_insertions=(
		# TODO CRW-2725 when CRW 3.0 is live, re-enable the replaces directive instead of this deletion
		[".spec.replaces"]="DELETEME"
		# [".spec.replaces"]="devspacesoperator.v${CSV_VERSION_PREV}"
		[".spec.version"]="${CSV_VERSION}"
		['.spec.displayName']="Red Hat OpenShift Dev Spaces"
		['.metadata.annotations.description']="Devfile v2 and v1 development solution, 1 instance per cluster, for portable, collaborative k8s workspaces."
	)
	for updateName in "${!spec_insertions[@]}"; do
		updateVal="${spec_insertions[$updateName]}"
		replaceField "${CSVFILE}" "${updateName}" "${updateVal}" "${COPYRIGHT}"
	done
	echo "Converted (yq #3) ${CSVFILE}"

	# add more RELATED_IMAGE_ fields for the images referenced by the registries
	"${SCRIPTS_DIR}/insert-related-images-to-csv.sh" -v "${CSV_VERSION}" -t "${TARGETDIR}" --crw-branch "${MIDSTM_BRANCH}"

	# echo "    ${0##*/} :: Sort env var in ${CSVFILE}:"
	yq -Y '.spec.install.spec.deployments[].spec.template.spec.containers[0].env |= sort_by(.name)' "${CSVFILE}" > "${CSVFILE}2"
	echo "${COPYRIGHT}$(cat "${CSVFILE}2")" > "${CSVFILE}"
	rm -f "${CSVFILE}2"
	if [[ $(diff -q -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "    ${0##*/} :: Inserted (yq #5) ${CSVFILE}:"
		for updateName in "${!operator_replacements[@]}"; do
			echo -n " * $updateName: "
			# shellcheck disable=SC2016
			yq --arg updateName "${updateName}" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env? | .[] | select(.name == $updateName) | .value' "${CSVFILE}" 2>/dev/null
		done
	fi
done

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
# yq changes - transform env vars from Che to CRW values
CR_YAML="config/samples/org.eclipse.che_v1_checluster.yaml"
changed="$(
yq  -y '.spec.server.devfileRegistryImage=""|.spec.server.pluginRegistryImage=""' "${TARGETDIR}/${CR_YAML}" | \
yq  -y '.spec.server.cheFlavor="devspaces"' | \
yq  -y '.spec.server.workspaceNamespaceDefault="<username>-devspaces"' | \
yq  -y '.spec.auth.identityProviderAdminUserName="admin"|.spec.auth.identityProviderImage=""' | \
yq  -y 'del(.spec.k8s)')" && \
echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${CR_YAML}"
if [[ $(diff -u "$CR_YAML" "${TARGETDIR}/${CR_YAML}") ]]; then
	echo "Converted (yq #4) ${TARGETDIR}/${CR_YAML}"
fi

cp "${TARGETDIR}/bundle/${OLM_CHANNEL}/eclipse-che-preview-openshift/manifests/org_v1_che_crd.yaml" "${TARGETDIR}/manifests/devspaces.crd.yaml"

popd >/dev/null || exit
