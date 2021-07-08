### Dashboard

Here is the developer workflow if you want to contribute to it:

#### Devfile for dashboard development

The devfile: [https://github.com/eclipse-che/che-dashboard/blob/main/devfile.yaml](https://github.com/eclipse-che/che-dashboard/blob/main/devfile.yaml)

In this section, we show how to setup a Che environment to work on the Che dashboard, and how to use it.
For the whole workflows, we will need a workspace with such containers:

- Dashboard Dev container (a.k.a dash-dev): Dashdev is a all in one container for running commands such as build, test or start the dashboard server.

All containers have `/projects` folder mounted, which is shared among them.

Developer workflow:

1. Start the workspace with the devfile, it is cloning Che repo.
2. Build
3. Code ...
4. Run unit test
5. Start dashboard server and preview :warning: is not supported yet. Should be covered by https://github.com/eclipse/che/issues/18086

#### Step 1: Start the workspace with the Che Dashboard devfile.

In this section we are going to start a new workspace to work on che dashboard. The new workspace will have a che-dashboard project cloned. It will also setup the containers and commands in the `My workspace` view. We will use these commands in the next steps.

The workspace could be created by opening a link with repo included, like

```
${CHE_HOST}/#https://github.com/eclipse-che/che-dashboard
```

#### Step 2: Build

In this section we are going to build the dashboard project.

You can use the Che command `[UD] compile` (command pallette > Run task > … or containers view)
Basically, this command will run

```bash
# [dash-dev]
$ yarn install && yarn compile
```

#### Step 3: Code ...

#### Step 4: Run unit test (optional)

In this step, we will run the Dashboard unit tests:

You can use the Che command `[UD] test` (command pallette > Run task > … or containers view)
Basically, this command will run

```bash
# [dash-dev]
$ yarn install && yarn test
```

#### Step 5: Start dashboard server and preview

:warning: is not fully supported yet. Should be covered by https://github.com/eclipse/che/issues/18086

In this step, we will run the dashboard server and see the live reloadable preview.

You can use the Che command `[UD] start` (command pallette > Run task > … or containers view)

```bash
# [dashboard_dev_server]
$ yarn start --env.server=<che_api_url>
```
