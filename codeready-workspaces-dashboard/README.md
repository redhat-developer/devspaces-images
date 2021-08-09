[![CI](https://github.com/eclipse/che-dashboard/workflows/CI/badge.svg)](https://github.com/eclipse/che-dashboard/actions/workflows/ci.yaml)
[![Codecov](https://img.shields.io/codecov/c/github/eclipse/che-dashboard)](https://app.codecov.io/gh/eclipse/che-dashboard)

## About Eclipse Che

Eclipse Che is a next generation Eclipse IDE. This repository is licensed under the Eclipse Public License 2.0. Visit [Eclipse Che's Web site](https://eclipse.org/che/) for feature information or the main [Che assembly repository](https://github.com/eclipse/che) for a description of all participating repositories.

# Eclipse Che Dashboard

## Requirements

- Node.js `v12` and later.
- yarn `v2.4.1` or higher.

**Note**:
Below you can find installation instructions

- [Node.js](https://docs.npmjs.com/getting-started/installing-node)
- [yarn](https://yarnpkg.com/getting-started/install)

## Quick start

```sh
docker build . -f build/dockerfiles/Dockerfile -t quay.io/eclipse/che-dashboard:next
```

## Running

Install all dependencies:

```sh
yarn
```

and start dev-server:

The start command requires to specify a remote Eclipse Che server like:

```sh
yarn start --env.server=https://che-che.192.168.99.100.nip.io
```

The development server serves the project on [http://localhost:3000](http://localhost:3000).

Note: For Che/CRW to allow connection from localhost it should be configured in accordance.

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
  ADDITIONAL_WEBORIGINS: '"http://localhost:3000"'
  ADDITIONAL_REDIRECT_URIS: '"http://localhost:3000/*"'
EOF
# Due temporary limitation we need to rollout che operator to apply changes
kubectl rollout restart deployment/che-operator -n $CHE_NAMESPACE
```

Note: To use CodeReady Workspaces(based on Che) Hosted by Red Hat instance at https://workspaces.openshift.com, use the fully qualified host name of the cluster.
URL is looking like https://codeready-codeready-workspaces-operator.apps.sandbox.x8i5.p1.openshiftapps.com

```sh
yarn start --env.server=https://codeready-codeready-workspaces-operator.apps.sandbox.x8i5.p1.openshiftapps.com
```

To specify a different port, add `--port=3333`

For redirect/authentication issues, please validate settings of Valid Redirect URIs and Web Origins on keycloak for `che-public` client.
Valid Redirect URIs requires `http://localhost:3000/*` and Web Origins requires `http://localhost:3000` (using default port number)

For better debugging experience you need to have React and Redux Developer Tools installed in your browser.

### Production

To launch the production mode, the command is

```sh
yarn start:prod
```

To provide a custom remote server:

```sh
yarn start:prod --env.server=https://codeready-codeready-workspaces-operator.apps.sandbox.x8i5.p1.openshiftapps.com
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

Default branding data for the User Dashboard is located in [branding.constant.ts](src/services/bootstrap/branding.constant.ts)#BRANDING_DEFAULT. It can be overridden without re-building the project in [product.json](/assets/branding/product.json) file which should contain only values that should overwrite default ones.

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

## License

Che is open sourced under the Eclipse Public License 2.0.
