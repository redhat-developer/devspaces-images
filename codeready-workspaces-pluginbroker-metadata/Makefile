GOENV := CGO_ENABLED=0 GOOS=linux
GOFLAGS := -a -ldflags '-w -s' -a -installsuffix cgo
PLUGIN_REGISTRY_URL ?= "https://che-plugin-registry.openshift.io/v3"

ifeq (s390x, $(shell uname -m))
        RACE ?=
else
        RACE ?= -race
endif

all: ci build
.PHONY: all

.PHONY: ci
ci:
	docker build -f build/CI/Dockerfile .

.PHONY: build
build:
	$(GOENV) go build $(GOFLAGS) ./...

.PHONY: build-artifacts
build-artifacts:
	$(GOENV) go build $(GOFLAGS) -o plugin-artifacts-broker brokers/artifacts/cmd/main.go

.PHONY: build-metadata
build-metadata:
	$(GOENV) go build $(GOFLAGS) -o plugin-metadata-broker brokers/metadata/cmd/main.go

.PHONY: test
test:
	go test -v $(RACE) ./...

.PHONY: lint
lint:
	golangci-lint run -v

.PHONY: fmt
fmt:
	go fmt ./...

.PHONY: build-docker-artifacts
build-docker-artifacts:
	docker build -t quay.io/eclipse/che-plugin-artifacts-broker:latest -f build/artifacts/Dockerfile .

.PHONY: build-docker-metadata
build-docker-metadata:
	docker build -t quay.io/eclipse/che-plugin-metadata-broker:latest -f build/metadata/Dockerfile .

.PHONY: test-metadata
test-metadata:
	cd ./brokers/metadata/cmd; \
		go build main.go; \
		./main \
			--disable-push \
			--runtime-id wsId:env:ownerId \
			--registry-address ${PLUGIN_REGISTRY_URL} \
			--metas ../../testdata/config-plugin-ids.json

.PHONY: test-artifacts
test-artifacts:
	cd ./brokers/artifacts/cmd; \
		go build main.go; \
		./main \
			--disable-push \
			--runtime-id wsId:env:ownerId \
			--registry-address ${PLUGIN_REGISTRY_URL} \
			--metas ../../testdata/config-plugin-ids.json
