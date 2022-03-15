### Development flow

You can do che-plugin-broker development inside Eclipse Che workspace.

To install Eclipse Che you need to choose infrastructure(openshift, kubernetes)
and [set it up](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#setting-up-a-local-kubernetes-or-openshift-cluster).
To create development Eclipse Che workspace we provide che-plugin-broker devfile [devfile.yaml](devfile.yaml).
> See more about [devfile](https://redhat-developer.github.io/devfile)

### Create Eclipse Che workspace from devfile

To start Eclipse Che workspace, [install the latest chectl](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#installing-the-chectl-management-tool) and start new workspace from devfile:

```shell
$ chectl workspace:start --devfile=https://raw.githubusercontent.com/eclipse/che-plugin-broker/master/devfile.yaml
```

Then, open the link to the workspace. After the workspace starts, the Eclipse Che editor
clones che-plugin-broker source code to the folder `/projects/src/github.com/eclipse/che-plugin-broker`.
There are two development linux containers inside workspace: `dev` and `plugin-registry`.

### Dev container target

`dev` container created for development che-plugin-broker. It contains pre-installed development binaries:
golang, git, golangci-lint and so on. In the devfile, `/plugins` is mounted as a volume on the `dev` container
to store plugins binaries downloaded with help of `unified` plugin broker.

### Plugin registry container target

`plugin-registry` container is a micro-service to serve Eclipse Che plugins meta.yaml definitions.
The devfile defines this container in the workspace, and the plugin-registry's service is exposed in the internal container's network.
The `unified` plugin broker can connect to this service to get plugins meta.yaml information.

### Development commands

devfile.yaml provides development `tasks` for the Eclipse Che workspace.
These are defined in the devfile `commands` section.

To launch development commands in the Eclipse Che workspace, you can:

1. `My Workspace` panel. In this panel you can find development tasks and launch them by click.

2. `Run task...` menu: click `Terminal` menu in the main toolbar => click `Run task...` menu => select task by name and click it.
> Notice: also you can find menu `Run task...` using command palette. Type shortcut `Ctrl/Cmd + Shift + P` to call command palette, type `run task`.

3. Manually type task content in the terminal: `Terminal` => `Open Terminal in specific container` => select container with name `dev` and click Enter.
> Notice: use correct working dir for commands in the terminal.

### Compiling plugin brokers

There are two plugin brokers, that's why we have two commands to compile each of them.

To compile `init` plugin broker use task with name `compile "init" plugin broker`. Compiled binary will be located in the [init-plugin-broker binary folder](brokers/init/cmd).

To compile `unified` plugin broker use task with name `compile "unified" plugin broker`. Compiled binary will be located in the [unified-plugin-broker binary folder](brokers/unified/cmd).

### Start 'init' plugin broker

To start `init` plugin broker use command `start "init" plugin broker`. After execution this task volume `/plugins` in the `dev` container should be clean
(you can check it with help of terminal).

### Start 'unified' plugin broker

To start `unified` plugin broker use task `start "unified" plugin broker`. After execution this task volume `/plugins` should contains downloaded plugin binaries in the subfolder `sidecars`(you can check it with help of terminal).

### Run tests

To launch che-plugin-broker tests use task with name `run tests`.

### Format code

During development don't forget to format code.
To format che-plugin-broker code use task with name `format code`.

### Lint code

To lint che-plugin-broker code use task `lint code`.
