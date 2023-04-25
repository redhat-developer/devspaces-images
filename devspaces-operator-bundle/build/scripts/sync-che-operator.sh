#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
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
DS_VERSION=${CSV_VERSION%.*} # tag 2.y
UBI_TAG=8.6
POSTGRES_TAG=1
POSTGRES13_TAG=1 # use 1-26.1638356747 to pin to postgre 13.3, or 1 to use 13.x
OPENSHIFT_TAG="v4.11"

usage () {
	echo "Usage:   ${0##*/} -v [DS CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]"
	echo "Example: ${0##*/} -v 2.y.0 -s ${HOME}/projects/che-operator -t /tmp/devspaces-operator"
	echo "Options:
	--ds-tag ${DS_VERSION}
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
	# for CSV_VERSION = 2.2.0, get DS_VERSION = 2.2
	'-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
	# paths to use for input and ouput
	'-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
	'-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
	'--help'|'-h') usage;;
	# optional tag overrides
	'--ds-tag') DS_VERSION="$2"; shift 1;;
	'--ubi-tag') UBI_TAG="$2"; shift 1;;
	'--postgres-tag') POSTGRES_TAG="$2"; shift 1;; # for deprecated 9.6 
	'--postgres13-tag') POSTGRES13_TAG="$2"; shift 1;; # for 13 (@since CRW 2.14)
	'--openshift-tag') OPENSHIFT_TAG="$2"; shift 1;;
  esac
  shift 1
done

if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
DS_RRIO="registry.redhat.io/devspaces"
DS_OPERATOR="devspaces-rhel8-operator"
DS_CONFIGBUMP_IMAGE="${DS_RRIO}/configbump-rhel8:${DS_VERSION}"
DS_DASHBOARD_IMAGE="${DS_RRIO}/dashboard-rhel8:${DS_VERSION}"
DS_DEVFILEREGISTRY_IMAGE="${DS_RRIO}/devfileregistry-rhel8:${DS_VERSION}"
DS_PLUGINREGISTRY_IMAGE="${DS_RRIO}/pluginregistry-rhel8:${DS_VERSION}"
DS_SERVER_IMAGE="${DS_RRIO}/server-rhel8:${DS_VERSION}"
DS_TRAEFIK_IMAGE="${DS_RRIO}/traefik-rhel8:${DS_VERSION}"

UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"
UDI_VERSION_ZZZ=$(skopeo inspect docker://quay.io/devspaces/udi-rhel8:${DS_VERSION} | yq -r '.RepoTags' | sort -uV | grep "${DS_VERSION}-" | grep -E -v "\.[0-9]{10}" | tr -d '", ' | tail -1) # get 3.5-16, not 3.5-16.1678881134
UDI_IMAGE_TAG=$(skopeo inspect docker://quay.io/devspaces/udi-rhel8:${UDI_VERSION_ZZZ} | yq -r '.Digest')
UDI_IMAGE="registry.redhat.io/devspaces/udi-rhel8@${UDI_IMAGE_TAG}"
POSTGRES_IMAGE="registry.redhat.io/rhel8/postgresql-96:${POSTGRES_TAG}"
POSTGRES13_IMAGE="registry.redhat.io/rhel8/postgresql-13:${POSTGRES13_TAG}"
RBAC_PROXY_IMAGE="registry.redhat.io/openshift4/ose-kube-rbac-proxy:${OPENSHIFT_TAG}"
OAUTH_PROXY_IMAGE="registry.redhat.io/openshift4/ose-oauth-proxy:${OPENSHIFT_TAG}"

# global / generic changes
pushd "${SOURCEDIR}" >/dev/null
COPY_FOLDERS="api bundle config controllers hack mocks pkg vendor version"
echo "Rsync ${COPY_FOLDERS} to ${TARGETDIR}"
# shellcheck disable=SC2086
rsync -azrlt ${COPY_FOLDERS} ${TARGETDIR}/

# sed changes
while IFS= read -r -d '' d; do
	if [[ -d "${SOURCEDIR}/${d%/*}" ]]; then mkdir -p "${TARGETDIR}"/"${d%/*}"; fi
	if [[ -f "${TARGETDIR}/${d}" ]]; then
		sed -i "${TARGETDIR}/${d}" -r \
			-e "s|quay.io/eclipse/che-operator:.+|${DS_RRIO}/${DS_OPERATOR}:latest|" \
			-e "s|Eclipse Che|Red Hat OpenShift Dev Spaces|g" \
			-e 's|che/operator|devspaces/operator|' \
			-e 's|che-operator|devspaces-operator|' \
			-e 's|name: eclipse-che|name: devspaces|' \
			-e 's|/bin/devspaces-operator|/bin/che-operator|' \
			-e 's#(githubusercontent|github).com/eclipse/devspaces-operator#\1.com/eclipse/che-operator#g' \
			-e 's#(githubusercontent|github).com/eclipse-che/devspaces-operator#\1.com/eclipse-che/che-operator#g' \
			-e 's|devworkspace-devspaces-operator|devworkspace-che-operator|'
		if [[ $(diff -u "${SOURCEDIR}/${d}" "${TARGETDIR}/${d}") ]]; then
			echo "    ${0##*/} :: Converted (sed) ${d}"
		fi
	fi
done <   <(find bundle config pkg/deploy api controllers -type f -not -name "defaults_test.go" -print0)

# shellcheck disable=SC2086
# https://issues.redhat.com/browse/CRW-3114
while IFS= read -r -d '' d; do
	sed -r -e 's|<username>-che|<username>-devspaces|' \
	"$d" > "${TARGETDIR}/${d}"
	if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
		echo "    ${0##*/} :: Converted (sed) ${d}"
	fi
done <   <(find bundle config deploy api -type f -print0)

# shellcheck disable=SC2086
while IFS= read -r -d '' d; do
	sed -r \
		`# hardcoded test values` \
		-e 's|"docker.io/eclipse/che-operator:latest": * "che-operator:latest"|"'${DS_RRIO}/${DS_OPERATOR}':latest":  "'${DS_OPERATOR}':latest"|' \
		-e 's|"eclipse/che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${DS_RRIO}'/server-operator-rhel8:2.0": "server-operator-rhel8:2.0"|' \
		-e 's|"che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${DS_RRIO}/${DS_OPERATOR}:${DS_VERSION}'":  "'${DS_OPERATOR}:${DS_VERSION}'"|' \
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
	changed=$(yq -Y --arg updateName "${updateName}" 'del('${updateName}')' "${theFile}")
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

# yq changes - transform env vars from Che to DS values

##### update the first container yaml

# see both sync-che-o*.sh scripts - need these since we're syncing to different midstream/dowstream repos
# yq changes - transform env vars from Che to DS values
declare -A operator_replacements=(
	["CHE_VERSION"]="${CSV_VERSION}" # set this to x.y.z version, matching the CSV
	["CHE_FLAVOR"]="devspaces"
	["CONSOLE_LINK_NAME"]="che" # use che, not workspaces - CRW-1078

	["RELATED_IMAGE_che_server"]="${DS_SERVER_IMAGE}"
	["RELATED_IMAGE_dashboard"]="${DS_DASHBOARD_IMAGE}"
	["RELATED_IMAGE_devfile_registry"]="${DS_DEVFILEREGISTRY_IMAGE}"
	["RELATED_IMAGE_plugin_registry"]="${DS_PLUGINREGISTRY_IMAGE}"

	# hardcoded to latest DWO release, so that we replace the upstream value... but this isn't actually used downstream
	["RELATED_IMAGE_devworkspace_controller"]="registry.redhat.io/devworkspace/devworkspace-rhel8-operator" 

	["RELATED_IMAGE_single_host_gateway"]="${DS_TRAEFIK_IMAGE}"
	["RELATED_IMAGE_single_host_gateway_config_sidecar"]="${DS_CONFIGBUMP_IMAGE}"

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

  ["CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL"]=""
  ["CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DISABLECONTAINERBUILDCAPABILITIES"]="false"
  ["CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTEDITOR"]="che-incubator/che-code/latest"
  # CRW-3662, CRW-3663, CRW-3489 theia removed from from dashboard
    # TODO also remove theia from factory support
    # TODO also remove theia from docs section #selecting-a-workspace-ide & related tables
  ["CHE_DEFAULT_SPEC_COMPONENTS_DASHBOARD_HEADERMESSAGE_TEXT"]=""

  # https://issues.redhat.com/browse/CRW-3312 replace upstream UDI image with downstream one for the current DS version (tag :3.yy)
  # https://issues.redhat.com/browse/CRW-3428 use digest instead of tag in CRD
  # https://issues.redhat.com/browse/CRW-4125 exclude freshmaker respins from the CRD
  ["CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS"]="[{\"name\": \"universal-developer-image\", \"container\": {\"image\": \"${UDI_IMAGE}\"}}]"
)

OPERATOR_DEPLOYMENT_YAML="config/manager/manager.yaml"
for updateName in "${!operator_replacements[@]}"; do
	updateVal="${operator_replacements[$updateName]}"
	replaceEnvVarOperatorYaml "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" "${COPYRIGHT}" '.spec.template.spec.containers[0].env'
done
echo "Converted (yq #1) ${OPERATOR_DEPLOYMENT_YAML}"

# CRW-1579 set correct devspaces-rhel8-operator image and tag in operator deployment yaml
oldImage=$(yq -r '.spec.template.spec.containers[0].image' "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}")
if [[ $oldImage ]]; then
	replaceField "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" ".spec.template.spec.containers[0].image" "${oldImage%%:*}:${DS_VERSION}" "${COPYRIGHT}"
fi
echo "Converted (yq #2) ${OPERATOR_DEPLOYMENT_YAML}"

# if sort the file, we'll lose all the comments
yq -yY '.spec.template.spec.containers[0].env |= sort_by(.name)' "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}" > "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2"
echo "${COPYRIGHT}$(cat "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2")" > "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}"
rm -f "${TARGETDIR}/${OPERATOR_DEPLOYMENT_YAML}2"
echo "Converted (yq #4) ${OPERATOR_DEPLOYMENT_YAML}"

# delete unneeded files
rm -rf "${TARGETDIR}/cmd"
rm -rf "${TARGETDIR}/pkg/apis"
rm -rf "${TARGETDIR}/pkg/controller"
echo "Delete ${TARGETDIR}/bundle/stable"
rm -rf "${TARGETDIR}/bundle/stable"

# copy extra files
cp -f "${SOURCEDIR}/main.go" "${SOURCEDIR}/go.mod" "${SOURCEDIR}/go.sum" "${TARGETDIR}"

rm -rf "${TARGETDIR}/vendor"
cp -rf "${SOURCEDIR}/vendor" "${TARGETDIR}/vendor"

popd >/dev/null || exit
