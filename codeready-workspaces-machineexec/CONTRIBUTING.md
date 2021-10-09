### Recommended development flow

The most natural way to develop che-machine-exec is using Eclipse CHE workspace.
To install Eclipse CHE you need to choose infrastructure(openshift, kubernetes)
and [set up it](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#setting-up-a-local-kubernetes-or-openshift-cluster).
To create development Eclipse CHE workspace we provide che-machine-exec devfile [devfile.yaml](devfile.yaml).
> See more about [devfile](https://redhat-developer.github.io/devfile)

### Create Eclipse CHE workspace from devfile

To start Eclipse CHE workspace, [install the latest chectl](https://www.eclipse.org/che/docs/che-7/che-quick-starts.html#installing-the-chectl-management-tool) and start new workspace from devfile:

```shell
$ chectl workspace:start --devfile=https://raw.githubusercontent.com/eclipse/che-machine-exec/main/devfile.yaml
```

Open link to the workspace. After workspace start Eclipse CHE editor
clones che-machine-exec source code to the folder `/projects/che-machine-exec`.
This source code available inside development linux containers with names `dev` and `theia-dev`.

#### 'theia-dev' container target

To test che-machine-exec with ui-part you can use [che-theia](https://github.com/eclipse/che-theia.git).
In this case you need compile che-theia inside development container `theia-dev`.
See more: [che-theia development flow](https://github.com/eclipse/che-theia/blob/master/CONTRIBUTING.md).

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

### Validation licenses for runtime dependencies

che-machine-exec is an Eclipse Foundation project. So we have to use only open source runtime dependencies with Eclipse compatible license https://www.eclipse.org/legal/licenses.php.
Runtime dependencies license validation process described here: https://www.eclipse.org/projects/handbook/#ip-third-party
To merge code with third party dependencies you have to follow process: https://www.eclipse.org/projects/handbook/#ip-prereq-diligence
When you are using new golang dependencies you have to validate the license for transitive dependencies too.
You can skip license validation for test dependencies.
All new dependencies you can find using git diff in the go.sum file.

Sometimes in the go.sum file you can find few versions for the same dependency:

```go.sum
...
github.com/go-openapi/analysis v0.18.0/go.mod h1:IowGgpVeD0vNm45So8nr+IcQ3pxVtpRoBWb8PVZO0ik=
github.com/go-openapi/analysis v0.19.2/go.mod h1:3P1osvZa9jKjb8ed2TPng3f0i/UY9snX6gxi44djMjk=
...
```

In this case will be used only one version(the highest) in the runtime, so you need to validate license for only one of them(the latest).
But also you can find module path https://golang.org/ref/mod#module-path with major version suffix in the go.sum file:

```go.sum
...
github.com/evanphx/json-patch v4.11.0+incompatible/go.mod h1:50XU6AFN0ol/bzJsmQLiYLvXMP4fmwYFNcr97nuDLSk=
github.com/evanphx/json-patch/v5 v5.1.0/go.mod h1:G79N1coSVB93tBe7j6PhzjmR3/2VvlbKOFpnXhI9Bw4=
...
```

In this case we have the same dependency, but with different major versions suffix.
Main project module uses both these versions in runtime. So both of them should be validated.

Also there is some useful golang commands to take a look full list dependencies:

```bash
$ go list -mod=mod -m all
```

This command returns all test and runtime dependencies. Like mentioned above, you can skip test dependencies.

If you want to know dependencies relation you can build dependencies graph:

```bash
$ go mod graph
```

> IMPORTANT: Dependencies validation information should be stored in the `DEPENDENCIES.md` file.
