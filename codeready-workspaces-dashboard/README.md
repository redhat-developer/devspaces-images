[![CI](https://github.com/eclipse/che-dashboard/workflows/CI/badge.svg)](https://github.com/eclipse/che-dashboard/actions/workflows/ci.yaml)
[![Codecov](https://img.shields.io/codecov/c/github/eclipse/che-dashboard)](https://app.codecov.io/gh/eclipse/che-dashboard)

## About Eclipse Che

Eclipse Che is a next generation Eclipse IDE. This repository is licensed under the Eclipse Public License 2.0. Visit [Eclipse Che's Web site](https://eclipse.org/che/) for feature information or the main [Che assembly repository](https://github.com/eclipse/che) for a description of all participating repositories.

# Eclipse Che Dashboard

## Requirements

- Node.js `v12` and later.
- yarn `v1.20.0` or higher.

**Note**:
Below you can find installation instructions

- [Node.js](https://docs.npmjs.com/getting-started/installing-node)
- [yarn](https://yarnpkg.com/getting-started/install)

## Quick start

```sh
docker build . -f build/dockerfiles/Dockerfile -t quay.io/eclipse/che-dashboard:next
```

## Running locally against remote Che Cluster

To run Dashboard against Che Cluster you need access to Kubernetes cluster where it lives.
So, make sure kubeconfig from $KUBECONFIG (or if unset ~/.kube/config) has the target cluster as current.
If no - you may need to do oc login (if it's OpenShift) or modify it manually if it's Kubernetes.
Then you can proceed to the following steps:

```sh
# 1. Install all dependencies:
yarn
# 2. Run server locally
yarn start
# If you want to make sure the latest bits are used, add flag to recompile
# yarn start --force-build
# Optionally you may need to set CHE_NAMESPACE where CheCluster CR live
# which is eclipse-che by default
# export CHE_NAMESPACE="my-custom-che"
```

The development server serves the dashboard-frontend and dashboard-backend on [http://localhost:8080](http://localhost:8080).

Depending on your Che Cluster's routing, it may need additional configuration. See below:
- **Keycloak**: Keycloak has allow-list for URLs which can receive token.
  Localhost is not there by default, so you will need to configure it in the following way:
  ```bash
  # Note: eclipse-che is the default target namespace but if you have custom - change it below
  CHE_NAMESPACE="eclipse-che"
  cat <<EOF | kubectl apply -f -
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: keycloak-custom-config
    namespace: $CHE_NAMESPACE
    labels:
      app.kubernetes.io/part-of: che.eclipse.org
      app.kubernetes.io/component: keycloak-configmap
    annotations:
      che.eclipse.org/mount-as: env
      che.eclipse.org/ADDITIONAL_REDIRECT_URIS_env-name: ADDITIONAL_REDIRECT_URIS
      che.eclipse.org/ADDITIONAL_WEBORIGINS_env-name: ADDITIONAL_WEBORIGINS
  data:
    ADDITIONAL_WEBORIGINS: '"http://localhost:8080", "http://localhost:3000"'
    ADDITIONAL_REDIRECT_URIS: '"http://localhost:8080/*", "http://localhost:3000/*"'
  EOF
  # Note that if configmap is update but not created, you also need to rollout keycloak deployment
  # oc patch deployment/keycloak --patch "{\"spec\":{\"replicas\":0}}" -n $CHE_NAMESPACE
  # oc patch deployment/keycloak --patch "{\"spec\":{\"replicas\":1}}" -n $CHE_NAMESPACE

  # Due temporary limitation we need to rollout che operator to apply changes
  kubectl rollout restart deployment/che-operator -n $CHE_NAMESPACE
  ```

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

If Che is behind Keycloak (Che Server workspace engine or K8s DevWorkspace) you are able to run Dev Server against it directly:

```sh
yarn frontend:start --env.server=https://192.168.39.132.nip.io
```

If Che is behind Native Auth, local backend is prerequisite for Dev Server and then the command to run Dev Server is

```sh
yarn frontend:start --env.server=http://localhost:8080/
```

### Dependencies IP

To make sure all the dependencies satisfy Eclipse [Intellectual Property](https://www.eclipse.org/projects/handbook/#ip),
this repo uses https://github.com/che-incubator/dash-licenses which is a wrapper for https://github.com/eclipse/dash-licenses.

So, check [.deps/prod.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/prod.md) for dependencies we package and [.deps/dev.md](https://github.com/eclipse-che/che-dashboard/blob/main/.deps/dev.md) for ones we use at build time only.

To generate dependencies info:

```sh
yarn license:generate
```

## Branding

Default branding data for the User Dashboard is located in [branding.constant.ts](/packages/dashboard-frontend/src/services/bootstrap/branding.constant.ts)#BRANDING_DEFAULT. It can be overridden without re-building the project in [product.json](/packages/dashboard-frontend/assets/branding/product.json) file which should contain only values that should overwrite default ones.

### Configurability

Field `"configuration.cheCliTool"` should contain the name of a CLI tool that is recommended to be used to work with Che Server from the terminal. It's the `"chectl"` by default.

Example:

```json
{
  "configuration": {
    "cheCliTool": "chectl"
  }
}
```

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

## License

Che is open sourced under the Eclipse Public License 2.0.
