### Recommended development flow

The most natural way to develop che-machine-exec is using Eclipse CHE workspace.
To install Eclipse CHE you need to choose infrastructure(openshift, kubernetes)
and [set up it](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#setting-up-a-local-kubernetes-or-openshift-cluster).
To create development Eclipse CHE workspace we provide che-machine-exec devfile [devfile.yaml](devfile.yaml).
> See more about [devfile](https://redhat-developer.github.io/devfile)

### Create Eclipse CHE workspace from devfile

To start Eclipse CHE workspace, [install the latest chectl](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#installing-the-chectl-management-tool) and start new workspace from devfile:

```shell
$ chectl workspace:start --devfile=https://raw.githubusercontent.com/eclipse/che-machine-exec/master/devfile.yaml
```

Open link to the workspace. After workspace start Eclipse CHE editor
clones che-machine-exec source code to the folder `/projects/che-machine-exec`.
This source code available inside development linux containers with names `dev` and `theia-dev`.

#### 'theia-dev' container target

To test che-machine-exec with ui-part you can use [che-theia](https://github.com/eclipse/che-theia.git).
In this case you need compile che-theia inside development container `theia-dev`.
See more: [che-theia develompent flow](https://github.com/eclipse/che-theia/blob/master/CONTRIBUTING.md).

### Development commands

devfile.yaml provides development `tasks` for Eclipse CHE workspace.
List development tasks defined in the devfile `commands` section.

To launch development commands in the Eclipse CHE workspace there are three ways:

1. `My Workspace` panel. In this panel you can find development tasks and launch them by click.

2. `Run task...` menu: click `Terminal` menu in the main toolbar => click `Run task...` menu => select task by name and click it.
> Notice: also you can find menu `Run task...` using command palette. Type shortcut `Ctrl/Cmd + Shift + P` to call command palette, type `run task`.

3. Manually type task content in the terminal: `Terminal` => `Open Terminal in specific container` => select container with name `dev` and click Enter.
> Notice: use correct working dir for commands in the terminal.

#### Compilation che-machine-exec

To compile che-machine-exec binary use task with name `compile`.
This task uses shell script [compile.sh](compile.sh).

#### Run tests

To launch che-machine-exec tests use task with name `test`.

#### Format code

During development don't forget to format code.
To format che-machine-exec code use task with name `format`.

#### Start che-machine-exec server

To start che-machine-exec server you need [compile che-machine-exec](#compilation-che-machine-exec)
and start the server using `start exec server` task.
che-machine-exec server will be started by internal url: 0.0.0.0:5555
inside `dev` container. To find exposed route link you can use `My Workspace` panel.
For communication with che-machine-exec use websocket protocol.

#### Stop che-machine-exec server

To stop che-machine-exec server you can use task with name `stop exec server`.
