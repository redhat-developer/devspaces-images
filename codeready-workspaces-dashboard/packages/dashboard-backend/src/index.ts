/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import "reflect-metadata";
import fastify from "fastify";
import {
  container,
  IDevWorkspaceClient,
  INVERSIFY_TYPES,
} from "@eclipse-che/devworkspace-client";
import {
  authenticationHeaderSchema,
  devfileStartedBody,
  namespacedSchema,
  namespacedWorkspaceSchema,
} from "./schemas";
import {
  DevfileStartedBody,
  NamespacedParam,
  NamespacedWorkspaceParam,
} from "./models";
import { authenticateOpenShift } from "./openshift/kubeconfig";
import { initialize, initializeNodeConfig } from "./init";
import { routingClass } from "./config";

// TODO add detection for openshift or kubernetes, we can probably just expose the devworkspace-client api to get that done for us
// TODO add service account for kubernetes with all the needed permissions
// TODO make it work on kubernetes

// Initialize the server and exit if any needed environment variables aren't found
initialize();

// Get the default node configuration based off the provided environment arguments
const devworkspaceClientConfig = initializeNodeConfig();
const client: IDevWorkspaceClient = container.get(
  INVERSIFY_TYPES.IDevWorkspaceClient
);

const server = fastify();

server.register(require("fastify-cors"), {
  origin: [process.env.CHE_HOST],
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

server.register(require("fastify-websocket"));

server.addContentTypeParser(
  "application/merge-patch+json",
  { parseAs: "string" },
  function(req, body, done) {
    try {
      var json = JSON.parse(body as string);
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);

server.get(
  "/workspace/namespace/:namespace",
  {
    schema: {
      headers: authenticationHeaderSchema,
      params: namespacedSchema,
    },
  },
  async (request) => {
    const token = request.headers.authentication as string;
    const { namespace } = request.params as NamespacedParam;
    const { devworkspaceApi } = await authenticateOpenShift(
      client.getNodeApi(devworkspaceClientConfig),
      token
    );
    return devworkspaceApi.listInNamespace(namespace);
  }
);

server.post(
  "/workspace",
  {
    schema: {
      headers: authenticationHeaderSchema,
      body: devfileStartedBody,
    },
  },
  async (request) => {
    const token = request.headers.authentication as string;
    const { devfile, started } = request.body as DevfileStartedBody;
    const { devworkspaceApi } = await authenticateOpenShift(
      client.getNodeApi(devworkspaceClientConfig),
      token
    );
    return devworkspaceApi.create(devfile, routingClass, started);
  }
);

server.get(
  "/workspace/namespace/:namespace/:workspaceName",
  {
    schema: {
      headers: authenticationHeaderSchema,
      params: namespacedWorkspaceSchema,
    },
  },
  async (request) => {
    const token = request.headers.authentication as string;
    const {
      namespace,
      workspaceName,
    } = request.params as NamespacedWorkspaceParam;
    const { devworkspaceApi } = await authenticateOpenShift(
      client.getNodeApi(devworkspaceClientConfig),
      token
    );
    return devworkspaceApi.getByName(namespace, workspaceName);
  }
);

server.delete(
  "/workspace/namespace/:namespace/:workspaceName",
  {
    schema: {
      headers: authenticationHeaderSchema,
      params: namespacedWorkspaceSchema,
    },
  },
  async (request) => {
    const token = request.headers.authentication as string;
    const {
      namespace,
      workspaceName,
    } = request.params as NamespacedWorkspaceParam;
    const { devworkspaceApi } = await authenticateOpenShift(
      client.getNodeApi(devworkspaceClientConfig),
      token
    );
    return devworkspaceApi.delete(namespace, workspaceName);
  }
);

server.patch(
  "/workspace/namespace/:namespace/:workspaceName",
  {
    schema: {
      headers: authenticationHeaderSchema,
      params: namespacedWorkspaceSchema,
    },
  },
  async (request) => {
    const token = request.headers.authentication as string;
    const {
      namespace,
      workspaceName,
    } = request.params as NamespacedWorkspaceParam;
    const { body } = request;
    const started = (body as any).started as boolean;
    const { devworkspaceApi } = await authenticateOpenShift(
      client.getNodeApi(devworkspaceClientConfig),
      token
    );
    return devworkspaceApi.changeStatus(namespace, workspaceName, started);
  }
);

server.listen(8080, "0.0.0.0", (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

server.ready(() => {
  console.log(server.printRoutes());
});
