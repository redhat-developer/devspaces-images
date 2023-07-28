[![CI](https://github.com/eclipse/che-dashboard/workflows/CI/badge.svg)](https://github.com/eclipse/che-dashboard/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/eclipse-che/che-dashboard/branch/main/graph/badge.svg?token=ao9sqdlXeT)](https://codecov.io/gh/eclipse-che/che-dashboard)
[![Contribute (nightly)](https://img.shields.io/static/v1?label=nightly%20Che&message=for%20maintainers&logo=eclipseche&color=FDB940&labelColor=525C86)](https://che-dogfooding.apps.che-dev.x6e0.p1.openshiftapps.com#https://github.com/eclipse-che/che-dashboard&storageType=persistent)

## About Eclipse Che

Eclipse Che is a next generation Eclipse IDE. This repository is licensed under the Eclipse Public License 2.0. Visit [Eclipse Che's Web site](https://eclipse.org/che/) for feature information or the main [Che assembly repository](https://github.com/eclipse/che) for a description of all participating repositories.

# Eclipse Che Dashboard

## Requirements

- Node.js `v16` and later.
- yarn `v1.20.0` or higher.

**Note**:
Below you can find installation instructions

- [Node.js](https://docs.npmjs.com/getting-started/installing-node)
- [yarn](https://yarnpkg.com/getting-started/install)

## Quick start

```sh
docker build . -f build/dockerfiles/Dockerfile -t quay.io/eclipse/che-dashboard:next
```

## Running locally against remote Che Cluster (Node.js v.16)

To run Dashboard against Che Cluster you need access to Kubernetes cluster where it lives.
So, make sure kubeconfig from $KUBECONFIG (or if unset ~/.kube/config) has the target cluster as current.
If no - you may need to do `oc login` (if it's OpenShift) or modify it manually if it's Kubernetes.

Then you can proceed to the following steps:

```sh
# 1. Install all dependencies:
yarn
# 2. (Optional) Patch minikube cluster to enable local development flow:
yarn start:prepare
# 3. Export Che certificate
chectl cacert:export --destination=$TMPDIR
# 4. Set CHE_SELF_SIGNED_MOUNT_PATH
export CHE_SELF_SIGNED_MOUNT_PATH=$TMPDIR
# 5. Run server locally:
yarn start
# 6. (optional) Patch cluster to revert it to initial state:
yarn start:cleanup
# If you want to make sure the latest bits are used, add flag to recompile
# yarn start --force-build
# Optionally you may need to set CHE_NAMESPACE where CheCluster CR live
# which is eclipse-che by default
# export CHE_NAMESPACE="my-custom-che"
```

The development server serves the dashboard-frontend and dashboard-backend on [http://localhost:8080](http://localhost:8080).

- **Native Auth**:
  With Native Auth, routes are secured with OpenShift OAuth which we can't deal with easily.
  So, instead when you do `yarn start` we bypass OpenShift OAuth proxy while requesting Che Server by doing `kubectl port-forward`. So, no additional configuration is needed but note that your Dashboard will be authentication with the user from the current KUBECONFIG.

### Incremental builds

You may would like to watch changes and recompile them incrementally:
```sh
yarn --cwd packages/dashboard-backend build:watch
yarn --cwd packages/dashboard-frontend build:watch
```

As an alternative to build:watch for frontend, you can run Dev Server.

Local backend is prerequisite for Dev Server and then the command to run Dev Server is

```sh
yarn frontend:start
```

To avoid memory issues and the process being killed, more memory is possible through the following command in the frontend package directory:
```sh
NODE_OPTIONS="--max_old_space_size=6500" && yarn frontend:start
```

### Bundle analyzer

To get visualizations of what’s in your webpack bundle for dashboard-backend:
```sh
yarn --cwd  packages/dashboard-backend build --env bundleAnalyzer=true
```

To get visualizations of what’s in your webpack bundle for dashboard-frontend:
```sh
yarn --cwd  packages/dashboard-frontend build --env bundleAnalyzer=true
```

### Measure build speed

To measure build speed for dashboard-backend:
```sh
yarn --cwd  packages/dashboard-backend build:dev --env speedMeasure=true
```

To measure build speed for dashboard-frontend:
```sh
yarn --cwd  packages/dashboard-frontend build:dev --env speedMeasure=true
```

### Dependencies IP

To make sure all the dependencies satisfy Eclipse [Intellectual Property](https://www.eclipse.org/projects/handbook/#ip),
this repo uses https://github.com/che-incubator/dash-licenses which is a wrapper for https://github.com/eclipse/dash-licenses.

So, check [.deps/prod.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/prod.md) for dependencies we package and [.deps/dev.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/dev.md) for ones we use at build time only.

To generate dependencies info:

```sh
yarn license:generate
```

## Developing within Eclipse Che

This project contains a [devfile v2](https://github.com/eclipse-che/che-dashboard/blob/main/devfile.yaml) in the root of the project which specifies development dependencies and commands needed to develop the Eclipse Che Dashboard.

Within Eclipse Che, you are able to:
* download yarn dependencies and build the project
* work within a rich development environment like VS Code
* test your changes by starting a dashboard instance on a cluster (ex. your personal cluster)
* debug the project within the editor
* push changes to GitHub

###  Starting a workspace within Eclipse Che

Navigate to the following URL to start a new workspace within Eclipse Che:
```
{CHE-HOST}/#https://github.com/eclipse-che/che-dashboard
```

### Running devfile tasks to download yarn dependencies and build the project

For Che-theia and VS Code, tasks defined in the devfile can be ran by following these steps:
1. Open the command palette (Ctrl/Cmd + Shift + P)
2. Run the `Tasks: Run Tasks` command
3. Select the `installdependencies` task to install dependencies
4. Follow steps 1-2 again and select the `build` task to build the project

### Running the project locally against a remote Eclipse Che installation in a seperate cluster

To run the Dashboard against a remote Eclipse Che installation, provide your cluster credentials to the `tools` development container.

NOTE: You must have permissions to get/patch resources in the namespace in which the CheCluster CR was created.

1. Open the `tools` container within the editor.
2. For an OpenShift cluster, run the `oc login` command with the cluster credentials. For a Kubernetes cluster, configure the `~/.kube/config` file.
3. Run the `start` task defined in the devfile by following the steps 1 and 2 from [Running devfile tasks to download yarn dependencies and build the project](#running-devfile-tasks-to-download-yarn-dependencies-and-build-the-project) to start the dashboard instance.
4. Wait for the Che-Theia / VS Code notification stating that local-server is now listening on port 8080. Click on `Open in New Tab`. This opens a new tab running the latest Dashboard changes.

### Debugging

To start the Dashboard for debugging, run the `build` and `start` tasks by following the steps 1 and 2 from  [Running devfile tasks to download yarn dependencies and build the project](#running-devfile-tasks-to-download-yarn-dependencies-and-build-the-project).

Debugging the dashboard-frontend and dashboard-backend can be done with your browser's developer tools. For Chrome DevTools, this can be done from the `Sources` tab. For debugging the backend, open the dedicated Chrome DevTools for Node.js.

To debug the backend within the editor, after running the `build` and `start` tasks, run the `Attach to Remote` debug launch configuration defined in `.vscode/launch.json`.

### Pushing to GitHub and making a PR

For PRs against the `eclipse-che/che-dashboard` repository, the PR source branch should also be located in `eclipse-che/che-dashboard` to allow all PR checks to run.
For this reason, if your Che instance has the GitHub oAuth app set up, you must follow [these steps to request access](https://github.com/eclipse/che/issues/21627#issuecomment-1216592765) to push to `eclipse-che/che-dashboard`.

To make a commit and push to remote, open a terminal in the `tools` container and run Git commands such as `git add` and `git push`.
You may choose to add a remote with `git add remote` and push to a personal fork rather than the upstream `eclipse-che/che-dashboard` repository.

### Building an image

For building an image within a Che workspace on an OpenShift cluster, the cluster and OpenShift user must be configured to allow with rootless builds. In addition, the following attribute must be added to the devfile:
```
attributes:
  controller.devfile.io/scc: container-build 
```

To build, run:
```
podman build . -f build/dockerfiles/Dockerfile -t quay.io/eclipse/che-dashboard:next
```

### Build a new image and apply it to the CheCluster in the current context

Export globally environment variables first:
```sh
$ export IMAGE_REGISTRY_USER_NAME=<IMAGE_REGISTRY_USER_NAME> && \
  export IMAGE_REGISTRY_HOST=<IMAGE_REGISTRY_HOST>
```

To a new image and apply it to the CheCluster, run:
```sh
yarn build-and-patch
```

### Update dashboard on remote cluster using `skaffold.dev`

To update the dashboard deployment you need access to the Kubernetes cluster (see [Running locally against remote Che Cluster (Node.js v.16)](#running-locally-against-remote-che-cluster-nodejs-v16))

Then proceed with the following steps:

```sh
# export an environment variable to define a repository you want images to be pushed, e.g.:
export DEFAULT_REPO="${IMAGE_REGISTRY_HOST}/${IMAGE_REGISTRY_USER_NAME}"
```

```sh
# and log in to the repository:
podman login quay.io
```

Now you can build the project and get the dashboard on the remote cluster updated:

```sh
# build the dashboard:
yarn build

# update the dashboard deployment once:
skaffold run --cleanup=false --default-repo=$DEFAULT_REPO

# or, run in development mode to watch for changes:
skaffold dev --cleanup=false --default-repo=$DEFAULT_REPO
```

## Branding

Default branding data for the User Dashboard is located in [branding.constant.ts](/packages/dashboard-frontend/src/services/bootstrap/branding.constant.ts)#BRANDING_DEFAULT. It can be overridden without re-building the project in [product.json](/packages/dashboard-frontend/assets/branding/product.json) file which should contain only values that should overwrite default ones.

### Configurability

Field `"header.warning"` allows you to display a message at the top of the dashboard. You can use HTML to configure the field but only the '\<a>' tag and 'href', 'target' properties are accepted. It's undefined by default.

Example:

```json
{
  "header": {
    "warning": "Server upgrades are happening at 1:00 PM. To learn more visit <a href='foo' target='_blank'>foo</a>"
  }
}
```

Field `"links"` allows you to configure links in the masthead, like
```
  links: [
    {
      text: 'Make a wish',
      href: 'mailto:che-dev@eclipse.org'
    },
    {
      text: 'Documentation',
      href: 'https://www.eclipse.org/che/docs/che-7'
    }
  ]
```

#### External Applications Menu (experimental)

The Dashboard has the ability to provide the way to navigate to the OpenShift cluster console via the `Applications` menu that is shown in the Dashboard masthead.
This ability can be tunned by setting the environment variables:
| Env var | Description | Default value |
| ------- | ----------- | ------------- |
| OPENSHIFT_CONSOLE_GROUP | The group title where Console link is shown | Applications |
| OPENSHIFT_CONSOLE_TITLE | The title that is displayed near icon. Set to "" to hide that Console Link at all. | OpenShift Console |
| OPENSHIFT_CONSOLE_ICON | The icon that is used for the link | ${CONSOLE_URL}/static/assets/redhat.png |

The following example shows how to provision that env vars with Che Operator:
```sh
CHE_NAMESPACE="eclipse-che"
cat <<EOF | kubectl apply -f -
kind: ConfigMap
apiVersion: v1
metadata:
  name: che-dashboard-custom-config
  namespace: eclipse-che
  labels:
    app.kubernetes.io/component: che-dashboard-configmap
    app.kubernetes.io/part-of: che.eclipse.org
  annotations:
    che.eclipse.org/OPENSHIFT_CONSOLE_GROUP_env-name: OPENSHIFT_CONSOLE_GROUP
    che.eclipse.org/OPENSHIFT_CONSOLE_TITLE_env-name: OPENSHIFT_CONSOLE_TITLE
    che.eclipse.org/OPENSHIFT_CONSOLE_ICON_env-name: OPENSHIFT_CONSOLE_ICON
    che.eclipse.org/mount-as: env
data:
  OPENSHIFT_CONSOLE_GROUP: Apps
  OPENSHIFT_CONSOLE_TITLE: OpenShift Container Platform
  OPENSHIFT_CONSOLE_ICON: https://example.com/icon.png
EOF

# Due temporary limitation we need to rollout che operator to apply changes
kubectl rollout restart deployment/che-operator -n $CHE_NAMESPACE
```

**Note**: This way to configure dashboard is experimental and may be changed.

## che-server API usage

Currently, Dashboard uses the following che-server API:

| Method | Path                                |
|--------|-------------------------------------|
| POST    | /kubernetes/namespace/provision    |
| GET   | /kubernetes/namespace                |
| POST   | /factory/resolver/                  |
| POST   | /factory/token/refresh              |
| GET    | /oauth                              |
| GET    | /oauth/token                        |
| DELETE | /oauth/token                        |

# Builds

This repo contains several [actions](https://github.com/eclipse-che/che-dashboard/actions), including:
* [![release latest stable](https://github.com/eclipse-che/che-dashboard/actions/workflows/release.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/release.yml)
* [![next builds](https://github.com/eclipse-che/che-dashboard/actions/workflows/next-build-multiarch.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/next-build-multiarch.yml)
* [![PR](https://github.com/eclipse-che/che-dashboard/actions/workflows/pr.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/pr.yml)

Downstream builds can be found at the link below, which is _internal to Red Hat_. Stable builds can be found by replacing the 3.x with a specific version like 3.2.  

* [dashboard_3.x](https://main-jenkins-csb-crwqe.apps.ocp-c1.prod.psi.redhat.com/job/DS_CI/job/dashboard_3.x/)


# License

Che is open sourced under the Eclipse Public License 2.0.
