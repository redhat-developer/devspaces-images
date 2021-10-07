# NOTE: this is used in BOTH
#   build/scripts/sync.sh (to set up correct values in midstream) 
#   and get-sources.sh (to set up correct values in downstream)
function updateDockerfileArgs() 
{
	# if not set via commandline, compute DEV_WORKSPACE_CONTROLLER_VERSION and DEV_HEADER_REWRITE_TRAEFIK_PLUGIN
	# from https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/job-config.json
	# shellcheck disable=SC2086
	if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]] || [[ -z "${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}" ]]; then
		MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
		if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
		configjson="$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/job-config.json")"
		if [[ $configjson == *"404"* ]] || [[ $configjson == *"Not Found"* ]]; then 
			echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/job-config.json"
			echo "[ERROR] Please use --dwob flag to set DEV_WORKSPACE_CONTROLLER_VERSION"
			echo "[ERROR] Please use --hrtpb flag to set DEV_HEADER_REWRITE_TRAEFIK_PLUGIN"
			exit 1
		fi
		if [[ $MIDSTM_BRANCH == "crw-2-rhel-8" ]]; then
			CRW_VERSION="$(echo "$configjson" | jq -r '.Version')"
		else 
			CRW_VERSION=${MIDSTM_BRANCH/crw-/}; CRW_VERSION=${CRW_VERSION//-rhel-8}
		fi
		if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]]; then
	        DEV_WORKSPACE_CONTROLLER_VERSION="$(echo "$configjson" | jq -r '.Other["DEV_WORKSPACE_CONTROLLER_VERSION"]["'${CRW_VERSION}'"]')"
			if [[ ${DEV_WORKSPACE_CONTROLLER_VERSION} == "null" ]]; then DEV_WORKSPACE_CONTROLLER_VERSION="main"; fi
		fi
		if [[ -z "${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}" ]]; then
			DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="$(echo "$configjson" | jq -r '.Other["DEV_HEADER_REWRITE_TRAEFIK_PLUGIN"]["'${CRW_VERSION}'"]')"
			if [[ ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN} == "null" ]]; then DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="main"; fi
		fi
	fi
	echo "[INFO] For ${CRW_VERSION} / ${MIDSTM_BRANCH}:"
	echo "[INFO]   DEV_WORKSPACE_CONTROLLER_VERSION   = ${DEV_WORKSPACE_CONTROLLER_VERSION}"
	echo "[INFO]   DEV_HEADER_REWRITE_TRAEFIK_PLUGIN  = ${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}"

	# update Dockerfile to record version we expect for DEV_WORKSPACE_CONTROLLER_VERSION and DEV_HEADER_REWRITE_TRAEFIK_PLUGIN
	sed $1 -r \
		-e 's#DEV_WORKSPACE_CONTROLLER_VERSION="([^"]+)"#DEV_WORKSPACE_CONTROLLER_VERSION="'${DEV_WORKSPACE_CONTROLLER_VERSION}'"#' \
		-e 's#DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="([^"]+)"#DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="'${DEV_HEADER_REWRITE_TRAEFIK_PLUGIN}'"#' \
		> $2
}
