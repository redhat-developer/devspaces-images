[![CircleCI](https://circleci.com/gh/eclipse/che-plugin-broker.svg?style=svg)](https://circleci.com/gh/eclipse/che-plugin-broker)
[![codecov](https://codecov.io/gh/eclipse/che-plugin-broker/branch/master/graph/badge.svg)](https://codecov.io/gh/eclipse/che-plugin-broker)

[![Master Build Status](https://ci.centos.org/buildStatus/icon?subject=master&job=devtools-che-plugin-broker-build-master/)](https://ci.centos.org/job/devtools-che-plugin-broker-build-master/)
[![Nightly Build Status](https://ci.centos.org/buildStatus/icon?subject=nightly&job=devtools-che-plugin-broker-nightly/)](https://ci.centos.org/job/devtools-che-plugin-broker-nightly/)
[![Release Build Status](https://ci.centos.org/buildStatus/icon?subject=release&job=devtools-che-plugin-broker-release/)](https://ci.centos.org/job/devtools-che-plugin-broker-release/)

# This repo contains implementations of several Che plugin brokers

## artifacts-plugin-broker

This broker runs as an init container on the workspace pod. Its job is to take in a list of plugin identifiers (either references to a plugin in the registry or a link to a plugin meta.yaml) and ensure that the correct .vsix and .theia extenions are downloaded into the `/plugins` directory, for each plugin requested for the workspace.

## metadata-plugin-broker

This broker must be run prior to starting the workspace's pod, as its job is to provision required containers, volumes, and environment variables for the workspace to be able to start with the installed plugins enabled.

## Development

Mocks are generated from interfaces using library [mockery](https://github.com/vektra/mockery)
To add new mock implementation for an interface or regenerate to an existing one use following
command when current dir is location of the folder containing the interface:

```shell
mockery -name=NameOfAnInterfaceToMock
```

### Build

There is a Makefile included in the repo to make building and testing the code easier:

| make target | function |
| --- | --- |
| `make ci` | Run CI tests in docker |
| `make build` | Build all code |
| `make build-artifacts` | Build only the artifacts broker, as binary `plugin-artifacts-broker` in the root of this repo |
| `make build-metadata` | Build only the metadata broker, as binary `plugin-metadata-broekr` in the root of this repo |
| `make test` | Run all tests in repo |
| `make lint` | Run `golangci-lint` on repo |
| `make fmt` | Run `go fmt` on all `.go` files |
| `make build-docker-artifacts` | Build `eclipse/che-plugin-artifacts-broker` image |
| `make build-docker-metadata` | Build `eclipse/che-plugin-metadata-broker` image |
| `test-metadata` | Build and run metadata broker locally, using plugin ids from `brokers/testdata/config-plugin-ids.json`; prints output to stdout |
| `test-artifacts` | Build and run artifacts broker locally, using plugin ids from `brokers/testdata/config-plugin-ids.json`; downloads all extensions to `/plugins` locally (directory must be writable, e.g. via a softlink to a user-writable directory) |

For more information, view the targets in the Makefile.

### CentOS CI
The following [CentOS CI jobs](https://ci.centos.org/) are associated with the repository:

- [`master`](https://ci.centos.org/job/devtools-che-plugin-broker-build-master/) - builds CentOS images on each commit to the [`master`](https://github.com/eclipse/che-plugin-broker/tree/master) branch and pushes them to [quay.io](https://quay.io/organization/eclipse).
- [`nightly`](https://ci.centos.org/job/devtools-che-plugin-broker-nightly/) - builds CentOS images and pushes them to [quay.io](https://quay.io/organization/eclipse) on a daily basis from the [`master`](https://github.com/eclipse/che-plugin-broker/tree/master) branch.
- [`release`](https://ci.centos.org/job/devtools-che-plugin-broker-release/) - builds CentOS and corresponding RHEL images from the [`release`](https://github.com/eclipse/che-plugin-broker/tree/release) branch. CentOS images are public and pushed to [quay.io](https://quay.io/organization/eclipse). RHEL images are also pushed to quay.io, but to the private repositories.
