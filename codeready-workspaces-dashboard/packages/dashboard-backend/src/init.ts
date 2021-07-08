/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { INodeConfig } from "@eclipse-che/devworkspace-client";

/**
 * Process the initialization of the server.
 * If CHE_HOST, KEYCLOAK_URL, KUBERNETES_SERVICE_HOST or KUBERNETES_SERVICE_PORT are undefined then exit the process since we cannot continue
 */
export function initialize(): void {
  // Check that CHE_HOST is defined
  if (!("CHE_HOST" in process.env)) {
    console.error("CHE_HOST environment variable is required");
    process.exit(1);
  }

  // Check that KEYCLOAK_URL is defined
  if (!("KEYCLOAK_URL" in process.env)) {
    console.error("KEYCLOAK_URL environment variable is required");
    process.exit(1);
  }

  // Check that KUBERNETES_SERVICE_HOST and KUBERNETES_SERVICE_PORT are defined. Inside of a container these will automatically be set
  if (!("KUBERNETES_SERVICE_HOST" in process.env)) {
    console.error("KUBERNETES_SERVICE_HOST environment variable is required");
    process.exit(1);
  }

  if (!("KUBERNETES_SERVICE_PORT" in process.env)) {
    console.error("KUBERNETES_SERVICE_PORT environment variable is required");
    process.exit(1);
  }
}

/**
 * Initialize the node configuration based off of the IN_CLUSTER environment variable.
 * If the environment variable is defined then use the value
 * If the environment variable is not defined then default to true
 * @returns A configured INodeConfig
 */
export function initializeNodeConfig(): INodeConfig {
    // If IN_CLUSTER is defined then use that value, if it's not then default inCluster is true
    const inCluster =
    "IN_CLUSTER" in process.env ? process.env.IN_CLUSTER === "true" : true;

    // Finish up the initialization by creating the node config for the devworkspace-client library
    const devworkspaceClientConfig: INodeConfig = {
        inCluster,
    };
    return devworkspaceClientConfig;
}
