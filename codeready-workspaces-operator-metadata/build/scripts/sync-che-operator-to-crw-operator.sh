#!/bin/bash
#
# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert che-operator upstream to downstream using sed & perl transforms, and deleting files

set -e
SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y
SSO_TAG=7.4
UBI_TAG=8.3
POSTGRES_TAG=1

usage () {
	echo "Usage:   $0 -v [VERSION] [-s /path/to/sources] [-t /path/to/generated]"
	echo "Example: $0 -v 2.y.0 -s ${HOME}/projects/che-operator -t /tmp/crw-operator"
	echo "Options:
	--sso-tag 7.4
	--ubi-tag 8.3
	--postgres-tag 1
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
	'--sso-tag') SSO_TAG="$2"; shift 1;;
	'--ubi-tag') UBI_TAG="$2"; shift 1;;
	'--postgres-tag') POSTGRES_TAG="$2"; shift 1;;
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

CRW_RRIO="registry.redhat.io/codeready-workspaces"
CRW_OPERATOR="crw-2-rhel8-operator"
CRW_SERVER_IMAGE="${CRW_RRIO}/server-rhel8:${CRW_VERSION}"
CRW_PLUGINREGISTRY_IMAGE="${CRW_RRIO}/pluginregistry-rhel8:${CRW_VERSION}"
CRW_DEVFILEREGISTRY_IMAGE="${CRW_RRIO}/devfileregistry-rhel8:${CRW_VERSION}"
CRW_BROKER_METADATA_IMAGE="${CRW_RRIO}/pluginbroker-metadata-rhel8:${CRW_VERSION}"
CRW_BROKER_ARTIFACTS_IMAGE="${CRW_RRIO}/pluginbroker-artifacts-rhel8:${CRW_VERSION}"
CRW_JWTPROXY_IMAGE="${CRW_RRIO}/jwtproxy-rhel8:${CRW_VERSION}"
UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"
POSTGRES_IMAGE="registry.redhat.io/rhel8/postgresql-96:${POSTGRES_TAG}"
SSO_IMAGE="registry.redhat.io/rh-sso-7/sso74-openshift-rhel8:${SSO_TAG}" # and registry.redhat.io/rh-sso-7/sso74-openj9-openshift-rhel8 too

# global / generic changes
pushd "${SOURCEDIR}" >/dev/null
	COPY_FOLDERS="cmd mocks olm pkg templates vendor version"
	echo "Rsync ${COPY_FOLDERS} to ${TARGETDIR}"
	rsync -azrlt ${COPY_FOLDERS} ${TARGETDIR}/

	# sed changes
	while IFS= read -r -d '' d; do
		if [[ -d "${SOURCEDIR}/${d%/*}" ]]; then mkdir -p "${TARGETDIR}"/"${d%/*}"; fi
		sed -r \
			-e "s|identityProviderPassword: ''|identityProviderPassword: 'admin'|g" \
			-e "s|quay.io/eclipse/che-operator:.+|${CRW_RRIO}/${CRW_OPERATOR}:latest|" \
			-e "s|Eclipse Che|CodeReady Workspaces|g" \
			-e 's|(DefaultCheFlavor.*=) "che"|\1 "codeready"|' \
			-e 's|(DefaultPvcStrategy.*=) "common"|\1 "per-workspace"|' \
			-e 's|che/operator|codeready/operator|' \
			-e 's|che-operator|codeready-operator|' \
			-e 's|name: eclipse-che|name: codeready-workspaces|' \
			-e "s|cheImageTag: 'nightly'|cheImageTag: ''|" \
			-e 's|/bin/codeready-operator|/bin/che-operator|' \
			-e 's#(githubusercontent|github).com/eclipse/codeready-operator#\1.com/eclipse-che/che-operator#g' \
		"$d" > "${TARGETDIR}/${d}"
		if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
			echo "Converted (sed) ${d}"
		fi
	done <   <(find deploy pkg/deploy -type f -not -name "defaults_test.go" -print0)

	while IFS= read -r -d '' d; do
		sed -r \
			-e 's|(cheVersionTest.*=) ".+"|\1 "'${CRW_VERSION}'"|' \
			\
			-e 's|(cheServerImageTest.*=) ".+"|\1 "'${CRW_SERVER_IMAGE}'"|' \
			-e 's|(pluginRegistryImageTest.*=) ".+"|\1 "'${CRW_PLUGINREGISTRY_IMAGE}'"|' \
			-e 's|(devfileRegistryImageTest.*=) ".+"|\1 "'${CRW_DEVFILEREGISTRY_IMAGE}'"|' \
			\
			-e 's|(brokerMetadataTest.*=) ".+"|\1 "'${CRW_BROKER_METADATA_IMAGE}'"|' \
			-e 's|(brokerArtifactsTest.*=) ".+"|\1 "'${CRW_BROKER_ARTIFACTS_IMAGE}'"|' \
			-e 's|(jwtProxyTest.*=) ".+"|\1 "'${CRW_JWTPROXY_IMAGE}'"|' \
			\
			-e 's|(pvcJobsImageTest.*=) ".+"|\1 "'${UBI_IMAGE}'"|' \
			-e 's|(postgresImageTest.*=) ".+"|\1 "'${POSTGRES_IMAGE}'"|' \
			-e 's|(keycloakImageTest.*=) ".+"|\1 "'${SSO_IMAGE}'"|' \
			\
			`# hardcoded test values` \
			-e 's|"docker.io/eclipse/che-operator:latest": * "che-operator:latest"|"'${CRW_RRIO}/${CRW_OPERATOR}':latest":  "'${CRW_OPERATOR}':latest"|' \
			-e 's|"quay.io/eclipse/che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${CRW_RRIO}'/server-operator-rhel8:2.0": "server-operator-rhel8:2.0"|' \
			-e 's|"che-operator:[0-9.]+": *"che-operator:[0-9.]+"|"'${CRW_RRIO}/${CRW_OPERATOR}:${CRW_VERSION}'":  "'${CRW_OPERATOR}:${CRW_VERSION}'"|' \
		"$d" > "${TARGETDIR}/${d}"
		if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
			echo "Converted (sed) ${d}"
		fi
	done <   <(find pkg/deploy -type f -name "defaults_test.go" -print0)

	# yq changes - transform env vars from Che to CRW values

	# header to reattach to yaml files after yq transform removes it
	COPYRIGHT="#
#  Copyright (c) 2018-2021 Red Hat, Inc.
#    This program and the accompanying materials are made
#    available under the terms of the Eclipse Public License 2.0
#    which is available at https://www.eclipse.org/legal/epl-2.0/
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Contributors:
#    Red Hat, Inc. - initial API and implementation
"
	declare -A operator_replacements=(
		["CHE_VERSION"]="${CSV_VERSION}"
		["CHE_FLAVOR"]="codeready"
		["CONSOLE_LINK_NAME"]="che"

		["RELATED_IMAGE_che_server"]="${CRW_SERVER_IMAGE}"
		["RELATED_IMAGE_plugin_registry"]="${CRW_PLUGINREGISTRY_IMAGE}"
		["RELATED_IMAGE_devfile_registry"]="${CRW_DEVFILEREGISTRY_IMAGE}"

		["RELATED_IMAGE_che_workspace_plugin_broker_metadata"]="${CRW_BROKER_METADATA_IMAGE}"
		["RELATED_IMAGE_che_workspace_plugin_broker_artifacts"]="${CRW_BROKER_ARTIFACTS_IMAGE}"
		["RELATED_IMAGE_che_server_secure_exposer_jwt_proxy_image"]="${CRW_JWTPROXY_IMAGE}"

		["RELATED_IMAGE_pvc_jobs"]="${UBI_IMAGE}"
		["RELATED_IMAGE_postgres"]="${POSTGRES_IMAGE}"
		["RELATED_IMAGE_keycloak"]="${SSO_IMAGE}"
	)
	while IFS= read -r -d '' d; do
		for updateName in "${!operator_replacements[@]}"; do
			changed="$(cat "${TARGETDIR}/${d}" | \
yq  -y --arg updateName "${updateName}" --arg updateVal "${operator_replacements[$updateName]}" \
'.spec.template.spec.containers[].env = [.spec.template.spec.containers[].env[] | if (.name == $updateName) then (.value = $updateVal) else . end]' | \
yq  -y 'del(.spec.template.spec.containers[0].env[] | select(.name == "RELATED_IMAGE_che_tls_secrets_creation_job"))')" && \
			echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${d}"
		done
		if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
			echo "Converted (yq #1) ${d}"
		fi
	done <   <(find deploy -type f -name "operator*.yaml" -print0)

	declare -A operator_insertions=(
		["RELATED_IMAGE_keycloak_s390x"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
		["RELATED_IMAGE_keycloak_ppc64le"]="${SSO_IMAGE/-openshift-/-openj9-openshift-}"
	)
	while IFS= read -r -d '' d; do
		for updateName in "${!operator_insertions[@]}"; do
			changed="$(cat "${TARGETDIR}/${d}" | \
yq -y --arg updateName "${updateName}" --arg updateVal "${operator_insertions[$updateName]}" \
'.spec.template.spec.containers[].env += [{"name": $updateName, "value": $updateVal}]')" && \
			echo "${COPYRIGHT}${changed}" > "${TARGETDIR}/${d}"
		done
		if [[ $(diff -u "$d" "${TARGETDIR}/${d}") ]]; then
			echo "Converted (yq #2) ${d}"
		fi
	done <   <(find deploy -type f -name "operator*.yaml" -print0)

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

	# delete unneeded files
	echo "Delete olm/eclipse-che-preview-kubernetes and olm/eclipse-che-preview-openshift"
	rm -fr "${TARGETDIR}/olm/eclipse-che-preview-kubernetes olm/eclipse-che-preview-openshift"

popd >/dev/null

