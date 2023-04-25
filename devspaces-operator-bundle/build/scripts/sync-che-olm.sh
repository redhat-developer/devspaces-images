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
DS_VERSION=${CSV_VERSION%.*} # tag 3.y
CSV_VERSION_PREV=3.x.0
MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
OLM_CHANNEL="next" # or "stable", see https://github.com/eclipse-che/che-operator/tree/main/bundle
UBI_TAG=8.6
POSTGRES_TAG=1
POSTGRES13_TAG=1 # use 1-26.1638356747 to pin to postgre 13.3, or 1 to use 13.x
OPENSHIFT_TAG="v4.11"

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
	echo "Usage:   ${0##*/} -v [DS CSV_VERSION] -p [DS CSV_VERSION_PREV] -s [/path/to/sources] -t [/path/to/generated] [-b devspaces-repo-branch]"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) -b ${MIDSTM_BRANCH}"
	echo "Example: ${0##*/} -v ${CSV_VERSION} -p ${CSV_VERSION_PREV} -s ${HOME}/che-operator -t $(pwd) [if no che.version, use value from devspaces/devspaces-branch/pom.xml]"
	echo "Options:
	--ds-tag ${DS_VERSION}
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
    '-b'|'--ds-branch') MIDSTM_BRANCH="$2"; shift 1;; # branch of redhat-developer/devspaces from which to load plugin and devfile reg container refs
	# for CSV_VERSION = 3.2.0, get DS_VERSION = 3.2
	'-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
	# previous version to set in CSV
	'-p') CSV_VERSION_PREV="$2"; shift 1;;
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

if [[ ! "${MIDSTM_BRANCH}" ]]; then usage; fi
if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi

# if current CSV and previous CVS version not set, die
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi
if [[ "${CSV_VERSION_PREV}" == "3.x.0" ]]; then usage; fi

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

SOURCE_CSVFILE="${SOURCEDIR}/bundle/${OLM_CHANNEL}/eclipse-che/manifests/che-operator.clusterserviceversion.yaml"

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
		-e "s|url: https*://www.eclipse.org/che|url: https://developers.redhat.com/products/openshift-dev-spaces/overview/|g" \
		\
		-e 's|"eclipse-che"|"devspaces"|g' \
		-e 's|che-operator|devspaces-operator|g' \
		-e "s|Eclipse Che|Red Hat OpenShift Dev Spaces|g" \
		-e "s|Eclipse Foundation|Red Hat, Inc.|g" \
		\
		-e "s|name: eclipse-che.v.+|name: devspacesoperator.v${CSV_VERSION}|g" \
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
		-e "s|<username>-che|<username>-devspaces|" \
		\
		-e "s|quay.io/eclipse/devspaces-operator:.+|registry.redhat.io/devspaces/${DS_OPERATOR}:${DS_VERSION}|" \
		-e "s|(registry.redhat.io/devspaces/${DS_OPERATOR}:${DS_VERSION}).+|\1|" \
		-e "s|quay.io/eclipse/che-server:.+|registry.redhat.io/devspaces/server-rhel8:${DS_VERSION}|" \
		-e "s|quay.io/eclipse/che-plugin-registry:.+|registry.redhat.io/devspaces/pluginregistry-rhel8:${DS_VERSION}|" \
		-e "s|quay.io/eclipse/che-devfile-registry:.+|registry.redhat.io/devspaces/devfileregistry-rhel8:${DS_VERSION}|" \
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
		-e "s#quay.io/eclipse/devspaces-operator:.+#registry-proxy.engineering.redhat.com/rh-osbs/devspaces-operator:${DS_VERSION}#" \
		-e 's|IMAGE_default_|RELATED_IMAGE_|' \
		\
		` # CRW-927 set suggested namespace, append cluster-monitoring = true (removed from upstream as not supported in community operators)` \
		-e '/operatorframework.io\/cluster-monitoring:/d' \
		-e 's|operatorframework.io/suggested-namespace: .+|operatorframework.io/suggested-namespace: openshift-operators|' \
		-e '/operatorframework.io\/suggested-namespace/a \ \ \ \ operatorframework.io/cluster-monitoring: "true"\n'"$subscriptions" \
		-e '/annotations\:/i \ \ labels:\n    operatorframework.io/arch.amd64\: supported\n    operatorframework.io/arch.ppc64le\: supported\n    operatorframework.io/arch.s390x\: supported' \
		-e 's|devworkspace-devspaces-operator|devworkspace-che-operator|' \
		-e 's|"namespace": ".+"|"namespace": "openshift-devspaces"|' \
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

	# yq changes - transform env vars from Che to CRW values
	changed="$(yq  -Y '.spec.displayName="Red Hat OpenShift Dev Spaces"' "${CSVFILE}")" && \
		echo "${changed}" > "${CSVFILE}"
	if [[ $(diff -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "    ${0##*/} :: Converted (yq #1) ${CSVFILE}:"
		echo -n "    ${0##*/} ::  * .spec.displayName: "
		yq '.spec.displayName' "${CSVFILE}" 2>/dev/null
	fi

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

		# TODO https://issues.redhat.com/browse/CRW-4105 remove these once fully removed upstream 
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
	for updateName in "${!operator_replacements[@]}"; do
		updateVal="${operator_replacements[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env'
	done
	echo "Converted (yq #2) ${CSVFILE}"

	# insert replaces: field
	declare -A spec_insertions=(
		[".spec.replaces"]="devspacesoperator.v${CSV_VERSION_PREV}"
		[".spec.version"]="${CSV_VERSION}"
		['.spec.displayName']="Red Hat OpenShift Dev Spaces"
		['.metadata.annotations.description']="Devfile v2 and v1 development solution, 1 instance per cluster, for portable, collaborative k8s workspaces."
		# CRW-3243, CRW-2798 skip Freshmaker and z-stream respins that went out before this release
		['.metadata.annotations.skipRange']=">=3.0.0 <${CSV_VERSION}"
	)
	for updateName in "${!spec_insertions[@]}"; do
		updateVal="${spec_insertions[$updateName]}"
		replaceField "${CSVFILE}" "${updateName}" "${updateVal}" "${COPYRIGHT}"
	done
	echo "Converted (yq #3) ${CSVFILE}"

	# add more RELATED_IMAGE_ fields for the images referenced by the registries
	bash -e "${SCRIPTS_DIR}/insert-related-images-to-csv.sh" -v "${CSV_VERSION}" -t "${TARGETDIR}" --ds-branch "${MIDSTM_BRANCH}"
	RETURN_CODE=$?
	if [[ $RETURN_CODE -gt 0 ]]; then echo "[ERROR] Problem occurred inserting related images into CSV: exit code: $RETURN_CODE"; exit $RETURN_CODE; fi

	# echo "    ${0##*/} :: Sort env var in ${CSVFILE}:"
	yq -Y '.spec.install.spec.deployments[].spec.template.spec.containers[0].env |= sort_by(.name)' "${CSVFILE}" > "${CSVFILE}2"
	echo "${COPYRIGHT}$(cat "${CSVFILE}2")" > "${CSVFILE}"
	rm -f "${CSVFILE}2"
	if [[ $(diff -q -u "${SOURCE_CSVFILE}" "${CSVFILE}") ]]; then
		echo "    ${0##*/} :: Inserted (yq #4) ${CSVFILE}:"
		for updateName in "${!operator_replacements[@]}"; do
			echo -n " * $updateName: "
			# shellcheck disable=SC2016
			yq --arg updateName "${updateName}" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env? | .[] | select(.name == $updateName) | .value' "${CSVFILE}" 2>/dev/null
		done
	fi

	declare -A operator_replacements_theia_removals=(
		# CRW-3489 remove theia from downstream (needs to also be removed from che-plugin-registry and che-operator, but this should do the job downstream only)
		# TODO remove this when theia fully removed from both plugin registries and che-operator clusterserviceversion files (as no longer needed)
		["RELATED_IMAGE_devspaces_theia_devfile_registry_image_GMXDMCQ_"]="DELETEME"
		["RELATED_IMAGE_devspaces_theia_plugin_registry_image_GMXDMCQ_"]="DELETEME"
		["RELATED_IMAGE_devspaces_theia_endpoint_devfile_registry_image_GMXDMCQ_"]="DELETEME"
		["RELATED_IMAGE_devspaces_theia_endpoint_plugin_registry_image_GMXDMCQ_"]="DELETEME"
	)
	for updateName in "${!operator_replacements_theia_removals[@]}"; do
		updateVal="${operator_replacements_theia_removals[$updateName]}"
		replaceEnvVar "${CSVFILE}" "" '.spec.install.spec.deployments[].spec.template.spec.containers[0].env'
	done
done

popd >/dev/null || exit
