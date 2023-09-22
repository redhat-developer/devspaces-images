#!/bin/bash
# rules for this build: cannot use hashicorp/consul > 1.15.5

if [[ -f $1/go.mod ]]; then 
    goMod="$1/go.mod"
else
    echo "[ERROR] could not find go.mod file in $1 - must exit!"
    exit 3
fi

declare -A limits
limits["hashicorp/consul"]="v1.15.5"
# limits["hashicorp/consul/api"]="v1.15"


checkVersion() {
  # $1 - upper limit version
  # $2 - actual version
  # $3 - versioned thing 
  if [[  "$1" = "$(echo -e "$1\n$2" | sort -rV | head -n1)" ]]; then
    # thing realversion <= upperlimitversion
	echo "[INFO] $3 version $2 <= $1: OK"
	true
  else 
	echo "[ERROR] $3 version $2 not allowed. Require $3 version <= $1"
	exit 2
  fi
}

echo "[INFO] Checking go.mod requirement upper limits..."
for i in "${!limits[@]}"; do

    lines="$(grep "$i " "$goMod")"
    for line in "$lines"; do
        version=$(echo "$line" | sed -r -e "s#.+$i ##"); # echo "Got version = $version"
        checkVersion ${limits[$i]} $version $i
    done

done
