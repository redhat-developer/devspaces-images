# Table of Contents

- [Contributing Guidelines](#contributing-guidelines)
  - [Code of Conduct](#code-of-conduct)
  - [Reporting Issues](#reporting-issues)
  - [Opening Pull Requests](#opening-pull-requests)
    - [Additional PR Requirements](#additional-pr-requirements)
      - [Approval of Project Dependencies](#approval-of-project-dependencies)
  - [Developing within Eclipse Che](#developing-within-eclipse-che)
    - [Starting a Workspace within Eclipse Che](#starting-a-workspace-within-eclipse-che)
    - [Running Devfile Tasks for Downloading Dependencies and Building the Project](#running-devfile-tasks-for-downloading-dependencies-and-building-the-project)
    - [Analyzing Bundles within Eclipse Che](#analyzing-bundles-within-eclipse-che)
    - [Measuring Build Speed within Eclipse Che](#measuring-build-speed-within-eclipse-che)
    - [Running the Project Locally Against a Remote Eclipse Che Installation on a Seperate Cluster](#running-the-project-locally-against-a-remote-eclipse-che-installation-on-a-seperate-cluster)
    - [Debugging](#debugging)
    - [Pushing to GitHub and Creating a Pull Request](#pushing-to-github-and-creating-a-pull-request)
    - [Building an Image](#building-an-image)
    - [Building a New Image and Applying it to the CheCluster in the Current Context](#building-a-new-image-and-applying-it-to-the-checluster-in-the-current-context)
    - [Updating Dashboard on Remote Cluster Using skaffold.dev](#updating-dashboard-on-remote-cluster-using-skaffolddev)
  - [Developing Locally Against Remote Che Cluster](#developing-locally-against-remote-che-cluster)
    - [Running the Project Locally](#running-the-project-locally)
    - [Building Changes Incrementally](#building-changes-incrementally)
    - [Analyzing Bundles](#analyzing-bundles)
    - [Measuring Build Speed](#measuring-build-speed)
    - [Checking Dependencies for Intellectual Property (IP) Compliance](#checking-dependencies-for-intellectual-property-ip-compliance)

---

# Contributing Guidelines

The Eclipse Che Dashboard is an integral component of the [Eclipse Che](link-to-eclipse-che-readme.md) project. As such, this project adheres to the identical set of contributing guidelines as Eclipse Che.

## Code of Conduct

Prior to beginning your contributions, we kindly request that you review our [Code of Conduct](https://github.com/eclipse/che/blob/main/CODE_OF_CONDUCT.md).

## Reporting Issues

If you encounter a bug, please begin by searching for an existing open issue [here (area/dashboard)](https://github.com/eclipse/che/issues?q=is%3Aopen+is%3Aissue+label%3Aarea%2Fdashboard). If you do not find a relevant open issue, feel free to create a new one using one of our provided [issue templates](https://github.com/eclipse/che/issues/new/choose).

## Opening Pull Requests

You can explore information about pull request templates and the necessary requirements for PR approval [at this location](https://github.com/eclipse/che/blob/main/CONTRIBUTING.md#pull-request-template-and-its-checklist).

### Additional PR Requirements

#### Approval of Project Dependencies

The author has to ensure that all dependencies satisfy Eclipse [Intellectual Property](https://www.eclipse.org/projects/handbook/#ip).

## Developing within Eclipse Che

This project features a [devfile v2](https://github.com/eclipse-che/che-dashboard/blob/main/devfile.yaml) located in the project's root directory. This devfile outlines the development dependencies and necessary commands required for Eclipse Che Dashboard development.

Within Eclipse Che, you can perform the following tasks:

- Download Yarn dependencies and build the project.
- Work within a rich development environment like VS Code.
- Test your changes by launching a dashboard instance on a cluster (e.g., your personal cluster).
- Debug the project directly within your editor.
- Push your changes to GitHub.

### Starting a Workspace within Eclipse Che

To start a new workspace within Eclipse Che, navigate to the following URL:

```sh
{CHE-HOST}/#https://github.com/eclipse-che/che-dashboard
```

### Running Devfile Tasks for Downloading Dependencies and Building the Project

For VS Code, execute tasks defined in the devfile with these steps:

1. Open the command palette (Ctrl/Cmd + Shift + P).
2. Execute the `Tasks: Run Task` command.
3. Select the `devfile` folder  and select the `[UD] install dependencies` task to install project dependencies.
4. Follow steps 1 and 2 again, select the `[UD] build` task to build the project.

### Analyzing Bundles within Eclipse Che

To create visualizations illustrating the contents of your webpack bundle for either dashboard-backend or dashboard-frontend, you can use the following procedure:

1. Execute the task named `[UD] backend bundle analyzer` (or the `[UD] frontend bundle analyzer`) as specified in the devfile.
2. Wait for the VS Code notification indicating that local server has been started. Click on `Open in New Tab` to access the bundle analyzer in a new tab.

### Measuring Build Speed within Eclipse Che

To determine the build speed of either the dashboard-backend or dashboard-frontend, you can initiate the task labeled `[UD] backend build` speed (or `[UD] frontend build speed`).

### Running the Project Locally Against a Remote Eclipse Che Installation on a Seperate Cluster

To run the Dashboard against a remote Eclipse Che installation, provide your cluster credentials to the `tools` development container.

**NOTE**: You must have permissions to get/patch resources in the namespace in which the CheCluster CR was created.

1. Open the `tools` container within the editor.
2. For an OpenShift cluster, execute the `oc login` command with your cluster credentials. For a Kubernetes cluster, configure the `~/.kube/config` file.
3. Execute the `[UD] start` task defined in the devfile by following the steps 1 and 2 from [Running Devfile Tasks for Downloading Dependencies and Building the Project](#running-devfile-tasks-for-downloading-dependencies-and-building-the-project) to start the dashboard instance.
4. Wait for the VS Code notification confirming that local server is now listening on port 8080. Click on `Open in New Tab` to open a new tab running the latest Dashboard changes.

### Debugging

To start the Dashboard for debugging, run the `[UD] build` and `[UD] start` tasks by following the steps 1 and 2 from  [Running Devfile Tasks for Downloading Dependencies and Building the Project](#running-devfile-tasks-for-downloading-dependencies-and-building-the-project).

Debugging the dashboard-frontend and dashboard-backend can be done with your browser developer tools. For Chrome DevTools, this can be done from the `Sources` tab. For debugging the backend, open the dedicated Chrome DevTools for Node.js.

To debug the backend within the editor, after running the `[UD] build` and `[UD] start` tasks, run the `Attach to Remote` debug launch configuration defined in `.vscode/launch.json`.

### Pushing to GitHub and Creating a Pull Request

For PRs targeting the `eclipse-che/che-dashboard` repository, the PR source branch should also be located in `eclipse-che/che-dashboard` to allow all PR checks to run.
Therefore, if your Che instance has the GitHub oAuth app set up, follow [these steps to request access](https://github.com/eclipse/che/issues/21627#issuecomment-1216592765) for pushing to `eclipse-che/che-dashboard`.

To commit and push changes to the remote repository, open a terminal within the `tools` container and run Git commands such as `git add` and `git push`.
You may opt to add a remote with `git add remote` and push to a personal fork rather than the upstream `eclipse-che/che-dashboard` repository.

### Building an Image

To build an image within a Che workspace on an OpenShift cluster, the cluster and OpenShift user must be configured to allow rootless builds.

To build the image, run:

```sh
podman build . -f build/dockerfiles/Dockerfile -t quay.io/eclipse/che-dashboard:next
```

### Building a New Image and Applying it to the CheCluster in the Current Context

First, export environment variables globally:

```sh
export IMAGE_REGISTRY_USER_NAME=<IMAGE_REGISTRY_USER_NAME> && \
  export IMAGE_REGISTRY_HOST=<IMAGE_REGISTRY_HOST>
```

To build a new image and apply it to the CheCluster, execute:

```sh
yarn build-and-patch
```

### Updating Dashboard on Remote Cluster Using `skaffold.dev`

To update the dashboard deployment you need access to the Kubernetes cluster (see [Running the Project Locally](#running-the-project-locally))

Then proceed with the following steps:

```sh
# Export an environment variable to define a repository for image pushes, e.g.:
export DEFAULT_REPO="${IMAGE_REGISTRY_HOST}/${IMAGE_REGISTRY_USER_NAME}"
```

```sh
# Log in to the repository:
podman login quay.io
```

Now you can build the project and update the dashboard on the remote cluster:

```sh
# Build the dashboard:
yarn build

# Update the dashboard deployment once:
skaffold run --cleanup=false --default-repo=$DEFAULT_REPO

# Or, run in development mode to watch for changes:
skaffold dev --cleanup=false --default-repo=$DEFAULT_REPO
```

## Developing Locally Against Remote Che Cluster

### Running the Project Locally

To run the Dashboard, you need to establish a connection to the Kubernetes cluster where Che is deployed. You can verify the current cluster in your kubeconfig file, typically located at $KUBECONFIG (or ~/.kube/config if $KUBECONFIG is not set). If the current cluster is not the one you want, you may need to use `oc login` (for OpenShift) or edit the file manually (for Kubernetes).

After that, you can follow these steps:

```sh
# 1. Install all the necessary dependencies:
yarn

# 2. (Optional) Apply a patch to the minikube cluster to enable local development:
yarn start:prepare

# 3. Export the Che certificate
chectl cacert:export --destination=$TMPDIR

# 4. Set CHE_SELF_SIGNED_MOUNT_PATH variable
export CHE_SELF_SIGNED_MOUNT_PATH=$TMPDIR

# 5. Run the development server locally:
yarn start

# 6. (Optional) Undo the patch to the minikube cluster:
yarn start:cleanup

# If you want to ensure that you're using the latest codebase, include the --force-build flag:
# yarn start --force-build

# Additionally, you may need to specify the CHE_NAMESPACE variable to indicate the namespace where the CheCluster custom resource is located.
# The default value is `eclipse-che``
# export CHE_NAMESPACE="my-custom-che"
```

The development server will run both the dashboard-frontend and dashboard-backend on [http://localhost:8080](http://localhost:8080).

**Native Auth**:
  With Native Auth, routes are secured with OpenShift OAuth which we can't deal with easily.
  So, instead when you do `yarn start` we bypass OpenShift OAuth proxy while requesting Che Server by doing `kubectl port-forward`. So, no additional configuration is needed but note that your Dashboard will be authentication with the user from the current KUBECONFIG.

### Building Changes Incrementally

If you want to automatically detect and build changes incrementally, follow these steps:

```sh
# Watch and build changes for the backend:
yarn --cwd packages/dashboard-backend build:watch
```

```sh
# Watch and build changes for the frontend:
yarn --cwd packages/dashboard-frontend build:watch
```

Local backend is a prerequisite for the development server. You can run the dev server using the following command:

```sh
yarn start
```

To avoid memory issues and the process being killed, more memory is possible through the following command in the frontend package directory:

```sh
NODE_OPTIONS="--max_old_space_size=6500" && yarn start
```

### Analyzing Bundles

To generate visualizations that display the contents of your webpack bundle for dashboard-backend, execute the following command:

```sh
yarn --cwd packages/dashboard-backend build --env bundleAnalyzer=true
```

For dashboard-frontend, use the following command to visualize the webpack bundle:

```sh
yarn --cwd packages/dashboard-frontend build --env bundleAnalyzer=true
```

### Measuring Build Speed

If you want to gauge the build speed for dashboard-backend, you can run the following command:

```sh
yarn --cwd packages/dashboard-backend build:dev --env speedMeasure=true
```

Similarly, to measure the build speed for dashboard-frontend, execute the following command:

```sh
yarn --cwd packages/dashboard-frontend build:dev --env speedMeasure=true
```

### Checking Dependencies for Intellectual Property (IP) Compliance

To ensure that all dependencies adhere to Eclipse's [Intellectual Property](https://www.eclipse.org/projects/handbook/#ip) guidelines, this repository relies on a tool called [dash-licenses](https://github.com/che-incubator/dash-licenses), which serves as a wrapper for [eclipse/dash-licenses](https://github.com/eclipse/dash-licenses).

For an overview of the dependencies included in the production build, please refer to [.deps/prod.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/prod.md). Additionally, you can check [.deps/dev.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/dev.md) to view dependencies used exclusively during the build process.

To generate information about these dependencies, you can use the following command:

```sh
yarn license:generate
```

This command will provide you with details about the dependencies and their compliance with intellectual property standards.
