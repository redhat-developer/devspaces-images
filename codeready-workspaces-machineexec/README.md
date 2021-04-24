[![Docker Build](https://github.com/eclipse-che/che-machine-exec/workflows/Docker%20Build/badge.svg)](https://github.com/eclipse-che/che-machine-exec/actions)
[![Codecov](https://img.shields.io/codecov/c/github/eclipse-che/che-machine-exec)](https://github.com/eclipse-che/che-machine-exec/)
# Che machine exec

A Golang server that creates machine-execs for Eclipse Che workspaces. It is used to spawn terminals or command processes. Che machine exec uses the JSON-RPC protocol to communicate with the client.

## Building a container image

To build a container image with che-machine-exec manually:

```
$ docker build --no-cache -t eclipse/che-machine-exec -f build/dockerfiles/Dockerfile .
```

## Testing che-machine-exec on OpenShift

1. [Build Eclipse Che Assembly](#building-eclipse-che-assembly).

2. Deploy Eclipse Che on OpenShift ([example templates](https://github.com/eclipse/che/blob/master/deploy/openshift/)).
   The output contains a link to the deployed Eclipse Che project. Use it to log in to Eclipse Che.

3. Register a new user on the login page. After login, you are redirected to the Eclipse Che user dashboard.

4. Create an Eclipse Che 7.x workspace using the default Che-Theia IDE. Then [test che-machine-exec using che-theia-terminal-extension](#testing-che-machine-exec-using-che-theia-terminal) and [test che-machine-exec using che-theia-task-plugin](#testing-che-machine-exec-using-che-theia-task-plugin).

## Testing che-machine-exec on OpenShift using Minishift

1. [Build Eclipse Che Assembly](#building-eclipse-che-assembly).

2. Install Minishift using the following instractions:
    - [Preparing to Install Minishift](https://docs.okd.io/latest/minishift/getting-started/preparing-to-install.html)
    - [Setting Up the Virtualization Environment](https://docs.okd.io/latest/minishift/getting-started/setting-up-virtualization-environment.html)

3. Install the `oc` tool:
    - [Download the `oc` binary for your platform](https://mirror.openshift.com/pub/openshift-v3/clients).
    - Extract and apply this binary path to the `PATH` system environment variable.
    - The `oc` tool is now availiable from the terminal:
 ```
 $ oc version
 oc v3.11.213
 kubernetes v1.11.0+d4cacc0
 features: Basic-Auth GSSAPI Kerberos SPNEGO
 ```

4. Start Minishift:
 ```
 $ minishift start --memory=8GB
 -- Starting local OpenShift cluster using 'kvm' hypervisor...
 ...
  OpenShift server started.
  The server is accessible via web console at:
      https://192.168.99.128:8443

  You are logged in as:
      User:     developer
      Password: developer

  To login as administrator:
      oc login -u system:admin
```

5. Store the Minishift master URL from the output of `minishift start` (`https://192.168.42.159:8443`) in the `CHE_INFRA_KUBERNETES_MASTER__URL` variable:
```
$ export CHE_INFRA_KUBERNETES_MASTER__URL=https://192.168.42.162:8443
```
> Note: When you delete the Minishift virtual machine (`minishift delete`) and create it again, this URL changes.

6. Register a new user on the `CHE_INFRA_KUBERNETES_MASTER__URL` page.

7. Log in to Minishift using `oc`. Use the new username and password for it:
```
$ oc login --server=${CHE_INFRA_KUBERNETES_MASTER__URL}
```
This command activates an OpenShift context to use the Minishift instance:

8. Deploy Eclipse Che on OpenShift ([example templates](https://github.com/eclipse/che/blob/master/deploy/openshift/)).
   The output contains a link to the deployed Eclipse Che project. Use it to log in to Eclipse Che.

9. Create an Eclipse Che 7.x workspace using the default Che-Theia IDE. Then [test che-machine-exec using che-theia-terminal-extension](#testing-che-machine-exec-using-che-theia-terminal) and [test che-machine-exec using che-theia-task-plugin](#testing-che-machine-exec-using-che-theia-task-plugin).

## Testing on Kubernetes using minikube

1. [Build Eclipse Che Assembly](#build-eclipse-che-assembly).

2. Install a minikube virtual machine on your computer. See the [minikube README](https://github.com/kubernetes/minikube/blob/master/README.md).

3. Deploy Eclipse Che using Helm:
+
   1. [Install Helm](https://github.com/kubernetes/helm/blob/master/docs/install.md).
+
   2. Start minikube:
```
$ minikube start --cpus 2 --memory 8192 --extra-config=apiserver.authorization-mode=RBAC
```
+
   3. Go to the `helm/che` directory:
```
$ cd ~/projects/che/deploy/kubernetes/helm/che
```
+
   4. Add the **cluster-admin** role for the `kube-system:default` account:
```
$ kubectl create clusterrolebinding add-on-cluster-admin --clusterrole=cluster-admin \
  --serviceaccount=kube-system:default
```
+
   5. Set the default Kubernetes context:
```
$ kubectl config use-context minikube
```
+
   6. To install tiller on the cluster, first create a tiller serviceAccount:
```
$ kubectl create serviceaccount tiller --namespace kube-system
```
+
   7. Then bind it to the **cluster-admin** role:
```
$ kubectl apply -f ./tiller-rbac.yaml
```
+
   8. Install tiller itself:
```
$ helm init --service-account tiller
```

4. Start NGINX-based Ingress controller:
```
$ minikube addons enable ingress
```

5. Deploy Eclipse Che on the Kubernetes cluster using one of the following two configurations:
   * Eclipse Che creates separated namespace for each new workspace:
```
$ helm upgrade --install che --namespace che ./
```

   * Eclipse Che creates all workspaces in the same namespace:
```
$ helm upgrade --install che --namespace=che --set global.cheWorkspacesNamespace=che ./
```
> Note:
> * To deploy multi-user Che, use the `-f ./values/multi-user.yaml` parameter.
> * To set an Ingress domain, use the `--set global.ingressDomain=<domain>` parameter.
> * To deploy Che using the minikube dashboard:
```
$ minikube dashboard
```

6. Create an Eclipse Che 7.x workspace using the default Che-Theia IDE. Then [test che-machine-exec using che-theia-terminal-extension](#testing-che-machine-exec-using-che-theia-terminal) and [test che-machine-exec using che-theia-task-plugin](#testing-che-machine-exec-using-che-theia-task-plugin).

## Building Eclipse Che assembly

> Requiements:
> * Java 8 or higher
> * Maven 3.5 or higher

1. Clone Eclipse Che:
```
$ git clone https://github.com/eclipse/che.git ~/projects/che
```

2. To save time, build only the `assembly-main` module, not the whole Eclipse Che project.
```
$ cd ~/projects/che/assembly/assembly-main
$ mvn clean install -DskipTests
```

## Testing che-machine-exec using che-theia-terminal

Eclipse Che 7.x workspaces that use the Che-Theia IDE include the che-theia-terminal extension. You can use this to test che-machine-exec.

In a Che 7 workspace:

1. Go to **Terminal** -> **Open Terminal in specific container**.
2. Select a container to create a new terminal on the bottom panel.

Alternatively, use the command palette:

1. Press `Ctrl + Shift + P` and type `terminal`.
2. Select a container with arrow keys.

## Testing che-machine-exec using che-theia-task-plugin

Eclipse Che 7.x workspaces that use the Che-Theia IDE include che-theia-task-plugin. You can use this to test che-machine-exec.

1. Create a new Che-Theia task for your project:
   1. In the project root, create a `.theia` folder.
   2. Create a `tasks.json` file in the `.theia` folder with the following content:
```json
{
    "tasks": [
        {
            "label": "che",
            "type": "che",
            "command": "echo hello"
        }
    ]
}
```

2. Run this task by going to **Terminal** -> **Run Task...**
3. After that Che-Theia shows a widget with the following output:
```
echo hello
```
