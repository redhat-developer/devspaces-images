# Define the environment variables affecting the deployment generation
include deploy/defaults.sh
export DWCO_IMG ?= $(DEFAULT_DWCO_IMG)
export DWCO_NAMESPACE ?= $(DEFAULT_DWCO_NAMESPACE)
export DWCO_PULL_POLICY ?= $(DEFAULT_DWCO_PULL_POLICY)

# create the temporary directory under the same parent dir as the Makefile
TEMP_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))/.tmp

# Produce CRDs that work back to Kubernetes 1.11 (no version conversion)
CRD_OPTIONS ?= "crd:trivialVersions=true"

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

ifeq (,$(shell which kubectl))
ifeq (,$(shell which oc))
$(error oc or kubectl is required to proceed)
else
K8S_CLI := oc
endif
else
K8S_CLI := kubectl
endif

# our targets don't generate files in a way make assumes
.PHONY: all clean test compile prepare run run_as_current_user debug deploy undeploy generate_deployment manifests fmt vet generate docker-build docker-push controller-gen help

all: compile

### clean: deletes the potential leftover generated files from the previous build runs
clean:
	@rm -Rf $(TEMP_DIR)

### test: Run tests
test: generate fmt vet manifests
	go test -v -coverprofile cover.out ./...

### compile: Build the manager binary
compile: generate fmt vet
	go build -o bin/manager main.go

### prepare: Prepares the cluster for running the operator - deploys CRDs, rbac and the service account
prepare: _mk_temp _platform manifests
# hiding the definition the variable in an eval makes it only defined once this target has run.
# Otherwise it would be evaluated eagerly at the make start regardless of the target run, resulting
# in a temporary directory being created needlessly.
	$(eval PREPARE_OUTPUT_DIR := $(shell mktemp -p $(TEMP_DIR) -d))
	OUTPUT_DIR=$(PREPARE_OUTPUT_DIR) DWCO_GENERATED_OVERLAY=support deploy/generate-deployment.sh --split-yaml
# We want to tolerate if the namespace already exists, so || true to ensure the success exit code
	$(K8S_CLI) create namespace $(DWCO_NAMESPACE) || true
	$(K8S_CLI) apply -f $(PREPARE_OUTPUT_DIR)/$(PLATFORM)/combined.yaml
	rm -Rf $(PREPARE_OUTPUT_DIR)

### run: Run against the configured Kubernetes cluster in ~/.kube/config using the deployed service account
run: generate fmt vet prepare
	$(eval KUBECONFIG:=$(shell deploy/generate-restricted-kubeconfig.sh $(TEMP_DIR) devworkspace-che-serviceaccount $(DWCO_NAMESPACE)))
	KUBECONFIG=$(KUBECONFIG) MAX_CONCURRENT_RECONCILES=1 go run ./main.go || true
	rm $(KUBECONFIG)

### run_as_current_user: Run against the configured Kubernetes cluster in ~/.kube/config using the current context
run_as_current_user: generate fmt vet prepare
	MAX_CONCURRENT_RECONCILES=1 go run ./main.go

debug: generate fmt vet prepare
	MAX_CONCURRENT_RECONCILES=1 dlv debug --listen=:2345 --headless=true --api-version=2 ./main.go --

### install: Deploy controller in the configured Kubernetes cluster in ~/.kube/config
install: _platform generate_deployment
	$(K8S_CLI) create namespace $(DWCO_NAMESPACE) || true
	$(K8S_CLI) apply -f deploy/deployment/$(PLATFORM)/combined.yaml

### uninstall: Removes everything related to Devworkspace Che from the cluster.
uninstall: _platform generate_deployment
	$(K8S_CLI) delete devworkspaces.workspace.devfile.io --all-namespaces --all --wait || true
	$(K8S_CLI) delete devworkspacetemplates.workspace.devfile.io --all-namespaces --all || true
	$(K8S_CLI) delete workspaceroutings.controller.devfile.io --all-namespaces --all --wait || true
	$(K8S_CLI) delete chemanagers.che.eclipse.org --all-namespaces --all --wait || true
	$(K8S_CLI) delete all -l "app.kubernetes.io/part-of=devworkspace-che-operator" --all-namespaces --wait || true
	$(K8S_CLI) delete -f deploy/deployment/$(PLATFORM)/combined.yaml --wait || true

### generate_deployment: generates the deployment files in deploy/deployment
generate_deployment: manifests
	@deploy/generate-deployment.sh --split-yaml

### manifests: Generate manifests e.g. CRD, RBAC etc.
manifests: controller-gen
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=manager-role webhook paths="./..." output:artifacts:config=deploy/templates/components/crd crd:crdVersions=v1

### fmt: Run go fmt against code
fmt:
	go fmt ./...

### vet: Run go vet against code
vet:
	go vet ./...

### generate: Generate code
generate: controller-gen
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

### docker-build: Build the docker image
docker-build: test
	docker build . -t ${DWCO_IMG} -f build/dockerfiles/Dockerfile

### docker-push: Push the docker image
docker-push:
	docker push ${DWCO_IMG}

### controller-gen: find or download controller-gen
# download controller-gen if necessary
controller-gen:
ifeq (, $(shell which controller-gen))
	@{ \
	set -e ;\
	CONTROLLER_GEN_TMP_DIR=$$(mktemp -d) ;\
	cd $$CONTROLLER_GEN_TMP_DIR ;\
	go mod init tmp ;\
	go get sigs.k8s.io/controller-tools/cmd/controller-gen@v0.5.0 ;\
	rm -rf $$CONTROLLER_GEN_TMP_DIR ;\
	}
CONTROLLER_GEN=$(GOBIN)/controller-gen
else
CONTROLLER_GEN=$(shell which controller-gen)
endif

### install_cert_manager: install Cert Mananger v1.0.4 on the cluster. This is not mandatory for the operator to work but simplifies creating custom certificates if needed.
install_cert_manager:
	$(K8S_CLI) apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.0.4/cert-manager.yaml

### help: print this message
help: Makefile
	@echo 'Available rules:'
	@sed -n 's/^### /    /p' $< | awk 'BEGIN { FS=":" } { printf "%-30s -%s\n", $$1, $$2 }'
	@echo ''
	@echo 'Supported environment variables:'
	@echo '    DWCO_IMG                    - Image used for controller'
	@echo '    DWCO_NAMESPACE              - Namespace to use for deploying controller'
	@echo '    DWCO_PULL_POLICY            - Pull policy of the operator image in the operator deployment'

_mk_temp:
	@mkdir -p $(TEMP_DIR)

# detects the kubernetes platform we're currently logged in to.
_platform:
	$(eval PLATFORM := $(shell deploy/detect-platform.sh $(K8S_CLI)))
	@echo Detected Kubernetes platform: $(PLATFORM)
