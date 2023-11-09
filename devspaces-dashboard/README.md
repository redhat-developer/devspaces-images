[![Next](https://github.com/eclipse-che/che-dashboard//workflows/Next%20container%20image/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/next-build-multiarch.yml)
[![codecov](https://codecov.io/gh/eclipse-che/che-dashboard/branch/main/graph/badge.svg?token=ao9sqdlXeT)](https://codecov.io/gh/eclipse-che/che-dashboard)
[![Contribute (nightly)](https://img.shields.io/static/v1?label=nightly%20Che&message=for%20maintainers&logo=eclipseche&color=FDB940&labelColor=525C86)](https://che-dogfooding.apps.che-dev.x6e0.p1.openshiftapps.com#https://github.com/eclipse-che/che-dashboard&storageType=persistent)

## About Eclipse Che

Eclipse Che is a next generation Eclipse IDE. This repository is licensed under the Eclipse Public License 2.0. Visit [Eclipse Che's Web site](https://eclipse.org/che/) for feature information or the main [Che assembly repository](https://github.com/eclipse/che) for a description of all participating repositories.

# Eclipse Che Dashboard

## Requirements

- Node.js `v18.16` and later.
- yarn `v1.20.0` or higher.

**Note**:
Below you can find installation instructions

- [Node.js](https://docs.npmjs.com/getting-started/installing-node)
- [yarn](https://yarnpkg.com/getting-started/install)

## Contributing

To report or address issues and actively contribute to the codebase, please refer to [CONTRIBUTING.md](./CONTRIBUTING.md) for comprehensive details on our requirements and instructions on getting started.

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

| Method | Path                            |
|--------|---------------------------------|
| POST   | /kubernetes/namespace/provision |
| GET    | /kubernetes/namespace           |
| POST   | /factory/resolver/              |
| POST   | /factory/token/refresh          |
| GET    | /oauth                          |
| GET    | /oauth/token                    |
| DELETE | /oauth/token                    |
| GET    | /scm/resolve                    |


# Builds

This repo contains several [actions](https://github.com/eclipse-che/che-dashboard/actions), including:
* [![release latest stable](https://github.com/eclipse-che/che-dashboard/actions/workflows/release.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/release.yml)
* [![next builds](https://github.com/eclipse-che/che-dashboard/actions/workflows/next-build-multiarch.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/next-build-multiarch.yml)
* [![PR](https://github.com/eclipse-che/che-dashboard/actions/workflows/pr.yml/badge.svg)](https://github.com/eclipse-che/che-dashboard/actions/workflows/pr.yml)

Downstream builds can be found at the link below, which is _internal to Red Hat_. Stable builds can be found by replacing the 3.x with a specific version like 3.2.  

* [dashboard_3.x](https://main-jenkins-csb-crwqe.apps.ocp-c1.prod.psi.redhat.com/job/DS_CI/job/dashboard_3.x/)


# License

Che is open sourced under the Eclipse Public License 2.0.
