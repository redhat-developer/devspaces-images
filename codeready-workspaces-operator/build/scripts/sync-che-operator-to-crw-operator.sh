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
# convert che-operator upstream to downstream using sed & yq transforms, and deleting files

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y
DWO_TAG=0.9
SSO_TAG=7.4
UBI_TAG=8.4
POSTGRES_TAG=1
POSTGRES13_TAG=1-26.1638356747
OPENSHIFT_TAG="v4.8"

usage () {
	echo "Usage:   ${0##*/} -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]"
	echo "Example: ${0##*/} -v 2.y.0 -s ${HOME}/projects/che-operator -t /tmp/crw-operator"
	echo "Options:
	--crw-tag ${CRW_VERSION}
	--dwo-tag ${DWO_TAG}
	--sso-tag ${SSO_TAG}
	--ubi-tag ${UBI_TAG}
	--postgres-tag ${POSTGRES_TAG}
	--postgres13-tag ${POSTGRES13_TAG}
	--openshift-tag ${OPENSHIFT_TAG}
	"
	exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
	# for CSV_VERSION = 2.2.0, get CRW_VERSION = 2.2
	'-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
	# paths to use for input and ouput
	'-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
	'-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
	'--help'|'-h') usage;;
	# optional tag overrides
	'--crw-tag') CRW_VERSION="$2"; shift 1;;
	'--dwo-tag') DWO_TAG="$2"; shift 1;;
	'--sso-tag') SSO_TAG="$2"; shift 1;;
	'--ubi-tag') UBI_TAG="$2"; shift 1;;
	'--postgres-tag') POSTGRES_TAG="$2"; shift 1;; # for deprecated 9.6 
	'--postgres13-tag') POSTGRES13_TAG="$2"; shift 1;; # for 13 (@since CRW 2.14)
	'--openshift-tag') OPENSHIFT_TAG="$2"; shift 1;;
  esac
  shift 1
done

if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
CRW_RRIO="registry.redhat.io/codeready-workspaces"
CRW_OPERATOR="crw-2-rhel8-operator"
CRW_BROKER_METADATA_IMAGE="${CRW_RRIO}/pluginbroker-metadata-rhel8:${CRW_VERSION}"
CRW_BROKER_ARTIFACTS_IMAGE="${CRW_RRIO}/pluginbroker-artifacts-rhel8:${CRW_VERSION}"
CRW_CONFIGBUMP_IMAGE="${CRW_RRIO}/configbump-rhel8:${CRW_VERSION}"
CRW_DASHBOARD_IMAGE="${CRW_RRIO}/dashboard-rhel8:${CRW_VERSION}"
CRW_DEVFILEREGISTRY_IMAGE="${CRW_RRIO}/devfileregistry-rhel8:${CRW_VERSION}"
DWO_IMAGE="registry.redhat.io/devworkspace/devworkspace-rhel8-operator:${DWO_TAG}"
CRW_JWTPROXY_IMAGE="${CRW_RRIO}/jwtproxy-rhel8:${CRW_VERSION}"
CRW_PLUGINREGISTRY_IMAGE="${CRW_RRIO}/pluginregistry-rhel8:${CRW_VERSION}"
CRW_SERVER_IMAGE="${CRW_RRIO}/server-rhel8:${CRW_VERSION}"
CRW_TRAEFIK_IMAGE="${CRW_RRIO}/traefik-rhel8:${CRW_VERSION}"
CRW_BACKUP_IMAGE="${CRW_RRIO}/backup-rhel8:${CRW_VERSION}"

UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"
POSTGRES_IMAGE="registry.redhat.io/rhel8/postgresql-96:${POSTGRES_TAG}"
POSTGRES13_IMAGE="registry.redhat.io/rhel8/postgresql-13:${POSTGRES13_TAG}"
SSO_IMAGE="registry.redhat.io/rh-sso-7/sso74-openshift-rhel8:${SSO_TAG}" # and registry.redhat.io/rh-sso-7/sso74-openj9-openshift-rhel8 too
RBAC_PROXY_IMAGE="registry.redhat.io/openshift4/ose-kube-rbac-proxy:${OPENSHIFT_TAG}"
OAUTH_PROXY_IMAGE="registry.redhat.io/openshift4/ose-oauth-proxy:${OPENSHIFT_TAG}"

# global / generic changes
pushd "${SOURCEDIR}" >/dev/null
COPY_FOLDERS="api bundle config controllers hack mocks olm pkg templates vendor version"
echo "Rsync ${COPY_FOLDERS} to ${TARGETDIR}"
# shellcheck disable=SC2086
rsync -azrlt ${COPY_FOLDERS} ${TARGETDIR}/

# sed changes
while IFS= read -r -d '' d; do
	if [[ -d "${SOURCEDIR}/${d%/*}" ]]; then mkdir -p "${TARGETDIR}"/"${d%/*}"; fi
	if [[ -f "${TARGETDIR}/${d}" ]]; then
		sed -i "${TARGETDIR}/${d}" -r \
			-e "s|identityProviderPassword: ''|identityProviderPassword: 'admin'|g" \
			-e "s|quay.io/eclipse/che-operator:.+|${CRW_RRIO}/${CRW_OPERATOR}:latest|" \
			-e "s|Eclipse Che|CodeReady Workspaces|g" \
			-e 's|(DefaultCheFlavor.*=) "che"|\1 "codeready"|' \
			-e 's|che/operator|codeready/operator|' \
			-e 's|che-operator|codeready-operator|' \
			-e 's|name: eclipse-che|name: codeready-workspaces|' \
			-e "s|cheImageTag: 'nightly'|cheImageTag: ''|" \
			-e 's|/bin/codeready-operator|/bin/che-operator|' \
			-e 's#(githubusercontent|github).com/eclipse/codeready-operator#\1.com/eclipse/che-operator#g' \
			-e 's#(githubusercontent|github).com/eclipse-che/codeready-operator#\1.com/eclipse-che/che-operator#g' \
			-e 's|devworkspace-codeready-operator|devworkspace-che-operator|'
		if [[ $(diff -u "${SOURCEDIR}/${d}" "${TARGETDIR}/${d}") ]]; then
			echo "    ${0##*/} :: Converted (sed) ${d}"
		fi
	fi
done <   <(find bundle config pkg/deploy api controllers -type f -not -name "defaults_test.go" -print0)

# shellcheck disable=SC2086
while IFS= read -r -d '' d; do
	sed -r \
		`# hardcoded test values` \
		-e 's|"docker.io/eclipse/che-operator:latest": * "che-operator:latest"|"'${CRW_RRIO}/${CRW_OPERATOR}':latest":  "'${CRW_OPERATOR}':latest"|' \
		-e 's|"eclipse/che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${CRW_RRIO}'/server-operator-rhel8:2.0": "server-operator-rhel8:2.0"|' \
		-e 's|"che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${CRW_RRIO}/${CRW_OPERATOR}:${CRW_VERSION}'":  "'${CRW_OPERATOR}:${CRW_VERSION}'"|' \
	"$d" > "${TARGETDIR}/${d}"
	if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
		echo "    ${0##*/} :: Converted (sed) ${d}"
	fi
done <   <(find pkg/deploy -type f -name "defaults_test.go" -print0)

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
	changed=$(yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" 'del(${updateName})' "${theFile}")
  else
	changed=$(yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" ${updateName}' = $updateVal' "${theFile}")
  fi
  echo "${header}${changed}" > "${theFile}"
}

# similar method to replaceEnvVar() but for a different path within the yaml
replaceEnvVarOperatorYaml()
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
		echo "    ${0##*/} rEVOY :: ${fileToChange##*/} :: ${updateName}: ${updateVal}"
		if [[ $updateVal == "DELETEME" ]]; then
			changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" 'del('${field}'[]|select(.name == $updateName))')
			echo "${header}${changed}" > "${fileToChange}.2"
		else
			# attempt to replace updateName field with updateVal value
			changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
${field}' = ['${field}'[] | if (.name == $updateName) then (.value = $updateVal) else . end]')
			echo "${header}${changed}" > "${fileToChange}.2"
			#  echo "replaced?"
			#  diff -u "${fileToChange}" "${fileToChange}.2" || true
			if [[ ! $(diff -u "${fileToChange}" "${fileToChange}.2") ]]; then
			echo "    >> insert $updateName = $updateVal"
			 changed=$(cat "${fileToChange}" | yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" \
				${field}' += [{"name": $updateName, "value": $updateVal}]')
			echo "${header}${changed}" > "${fileToChange}.2"
			fi
		fi
		mv "${fileToChange}.2" "${fileToChange}"
	fi
}

# yq changes - transform env vars from Che to CRW values

##### update the first container yaml

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
# yq changes - transform env vars from Che to CRW values
declare -A operator_replacements=(
	["CHE_VERSION"]="${CSV_VERSION}" # set this to x.y.z version, matching the CSV
	["CHE_FLAVOR"]="codeready"
	["CONSOLE_LINK_NAME"]="che" # use che, not workspaces - CRW-1078

	["RELATED_IMAGE_che_server"]="${CRW_SERVER_IMAGE}"
	["RELATED_IMAGE_dashboard"]="${CRW_DASHBOARD_IMAGE}"
	["RELATED_IMAGE_devfile_registry"]="${CRW_DEVFILEREGISTRY_IMAGE}"
	["RELATED_IMAGE_devworkspace_controller"]="${DWO_IMAGE}"
	["RELATED_IMAGE_plugin_registry"]="${CRW_PLUGINREGISTRY_IMAGE}"

	["RELATED_IMAGE_che_workspace_plugin_broker_metadata"]="${CRW_BROKER_METADATA_IMAGE}"
	["RELATED_IMAGE_che_workspace_plugin_broker_artifacts"]="${CRW_BROKER_ARTIFACTS_IMAGE}"
	["RELATED_IMAGE_che_server_secure_exposer_jwt_proxy_image"]="${CRW_JWTPROXY_IMAGE}"

	["RELATED_IMAGE_single_host_gateway"]="${CRW_TRAEFIK_IMAGE}"
	["RELATED_IMAGE_single_host_gateway_config_sidecar"]="${CRW_CONFIGBUMP_IMAGE}"
	["RELATED_IMAGE_internal_rest_backup_server"]="${CRW_BACKUP_IMAGE}"

	["RELATED_IMAGE_pvc_jobs"]="${UBI_IMAGE}"
	["RELATED_IMAGE_postgres"]="${POSTGRES_IMAGE}" # deprecated @since 2.13
	["RELATED_IMAGE_postgres_13_3"]="${POSTGRES13_IMAGE}" # CRW-2180 - new @since 2.13
	["RELATED_IMAGE_keycloak"]="${SSO_IMAGE}"

	# CRW-2303 - @since 2.12 DWO only (but needs to be available even on non-DWO installs)
	["RELATED_IMAGE_gateway_authentication_sidecar"]="${OAUTH_PROXY_IMAGE}"
	["RELATED_IMAGE_gateway_authorization_sidecar"]="${RBAC_PROXY_IMAGE}"

	# remove env vars using DELETEME keyword
	["RELATED_IMAGE_gateway_authentication_sidecar_k8s"]="DELETEME"
	["RELATED_IMAGE_gateway_authorization_sidecar_k8s"]="DELETEME"
	["RELATED_IMAGE_che_tls_secrets_creation_job"]="DELETEME"
	["RELATED_IMAGE_gateway_header_sidecar"]="DELETEME"
)

OPERATOR_DEPLOYMENT_YAML="config/manager/manager.yaml"
for updateName in "${!operator_replacements[@]}"; do
	updateVal="${operator_replacements[$updateName]}"
	replaceEnvVarOperatorYaml "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" "${COPYRIGHT}" '.spec.template.spec.containers[0].env'
done
echo "Converted (yq #1) ${OPERATOR_DEPLOYMENT_YAML}"

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
# insert keycloak image references for s390x and ppc64le
declare -A operator_insertions=(
	["RELATED_IMAGE_keycloak_s390x"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
	["RELATED_IMAGE_keycloak_ppc64le"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
)
for updateName in "${!operator_insertions[@]}"; do
	updateVal="${operator_insertions[$updateName]}"
	# apply same transforms in operator deployment yaml
	replaceEnvVarOperatorYaml "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" "${COPYRIGHT}" '.spec.template.spec.containers[0].env'
done
echo "Converted (yq #2) ${OPERATOR_DEPLOYMENT_YAML}"

# CRW-1579 set correct crw-2-rhel8-operator image and tag in operator deployment yaml
oldImage=$(yq -r '.spec.template.spec.containers[0].image' "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}")
if [[ $oldImage ]]; then
	replaceField "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" ".spec.template.spec.containers[0].image" "${oldImage%%:*}:${CRW_VERSION}" "${COPYRIGHT}"
fi
echo "Converted (yq #3) ${OPERATOR_DEPLOYMENT_YAML}"

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
# yq changes - transform env vars from Che to CRW values
CR_YAML="config/samples/org.eclipse.che_v1_checluster.yaml"
#shellcheck disable=2002
changed="$(cat "${TARGETDIR}/${CR_YAML}" | \
yq  -y '.spec.server.devfileRegistryImage=""|.spec.server.pluginRegistryImage=""' | \
yq  -y '.spec.server.cheFlavor="codeready"' | \
yq  -y '.spec.server.workspaceNamespaceDefault="<username>-codeready"' | \
yq  -y '.spec.auth.identityProviderAdminUserName="admin"|.spec.auth.identityProviderImage=""' | \
yq  -y 'del(.spec.k8s)')" && \
echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${CR_YAML}"
if [[ $(diff -u "${CR_YAML}" "${TARGETDIR}/${CR_YAML}") ]]; then
	echo "Converted (yq #4) ${TARGETDIR}/${CR_YAML}"
fi

# if sort the file, we'll lose all the comments
yq -yY '.spec.template.spec.containers[0].env |= sort_by(.name)' "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" > "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2"
echo "${COPYRIGHT}$(cat "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2")" > "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}"
rm -f "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2"
echo "Converted (yq #5) ${OPERATOR_DEPLOYMENT_YAML}"

# delete unneeded files
rm -rf "${TARGETDIR}/deploy"
rm -rf "${TARGETDIR}/cmd"
rm -rf "${TARGETDIR}/pkg/apis"
rm -rf "${TARGETDIR}/pkg/controller"
echo "Delete ${TARGETDIR}/bundle/nightly/eclipse-che-preview-kubernetes ${TARGETDIR}/bundle/stable"
rm -rf "${TARGETDIR}/bundle/nightly/eclipse-che-preview-kubernetes"
rm -rf "${TARGETDIR}/bundle/stable"

# copy extra files
cp -f "${SOURCEDIR}/main.go" "${SOURCEDIR}/go.mod" "${SOURCEDIR}/go.sum" "${TARGETDIR}"

rm -rf "${TARGETDIR}/pkg/deploy/server/deployment_che.go" \
"${TARGETDIR}/pkg/deploy/server/service.go" \
"${TARGETDIR}/pkg/deploy/server/deployment_che_test.go" \
"${TARGETDIR}/pkg/deploy/server/configmap_cert.go" \
"${TARGETDIR}/pkg/deploy/server/configmap_cert_test.go" \
"${TARGETDIR}/pkg/deploy/server/che_service_test.go" \
"${TARGETDIR}/pkg/deploy/server/che_configmap.go" \
"${TARGETDIR}/pkg/deploy/server/che_configmap_test.go"

rm -rf "${TARGETDIR}/vendor"
cp -rf "${SOURCEDIR}/vendor" "${TARGETDIR}/vendor"

# Comment out not used images
sed -i "${TARGETDIR}/pkg/deploy/defaults.go" -r \
-e 's|(\t)(defaultCheTLSSecretsCreationJobImage = getDefaultFromEnv\(util.GetArchitectureDependentEnv\("RELATED_IMAGE_che_tls_secrets_creation_job"\)\))|\1// \2|' \
-e 's|(\t)(defaultGatewayHeaderProxySidecarImage = getDefaultFromEnv\(util.GetArchitectureDependentEnv\("RELATED_IMAGE_gateway_header_sidecar"\)\))|\1// \2|'

sed -i "${TARGETDIR}/pkg/deploy/defaults.go" -r \
-e 's|(\t)(defaultCheTLSSecretsCreationJobImage = util.GetDeploymentEnv\(operatorDeployment, util.GetArchitectureDependentEnv\("RELATED_IMAGE_che_tls_secrets_creation_job"\)\))|\1// \2|' \
-e 's|(\t)(defaultGatewayHeaderProxySidecarImage = util.GetDeploymentEnv\(operatorDeployment, util.GetArchitectureDependentEnv\("RELATED_IMAGE_gateway_header_sidecar"\)\))|\1// \2|'

popd >/dev/null || exit
