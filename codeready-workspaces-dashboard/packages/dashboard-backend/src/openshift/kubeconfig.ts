/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import axios from 'axios';
import { KubeConfig, Cluster, User } from '@kubernetes/client-node';
import { IDevWorkspaceClientApi } from '@eclipse-che/devworkspace-client';

const keycloakAuthPath = '/auth/realms/che/broker/openshift-v4/token';

/**
 * Create a cluster kubernetes client cluster object
 * @throws Will throw an error if process.env['KUBERNETES_SERVICE_HOST'] or process.env['KUBERNETES_SERVICE_PORT'] are undefined
 * @returns A kubernetes client cluster object
 */
function createCluster(): Cluster {
    const host = process.env['KUBERNETES_SERVICE_HOST'];
    const port = process.env['KUBERNETES_SERVICE_PORT'];
    if (!host || !port) {
        throw new Error('Unknown KUBERNETES_SERVICE_HOST or KUBERNETES_SERVICE_PORT')
    }
    return {
        name: 'developer-cluster',
        server: `https://${host}:${port}`,
    } as Cluster;
}

/**
 * Create a kubernetes client node user with the provided openshift token
 * @param openShiftToken The openShift token you want to use for the user
 * @returns A kubernetes client node user object
 */
function createUser(openShiftToken: string): User {
    return {
        name: 'developer',
        token: openShiftToken
    } as User;
}

/**
 * Transform the keycloak token into an openshift token
 * @param keycloakToken
 * @throws Will throw an error if process.env.KEYCLOAK_URL is undefined 
 * @returns The openshift token obtained from the keycloak token
 */
async function keycloakToOpenShiftToken(keycloakToken: string): Promise<string> {
    const keycloak = process.env.KEYCLOAK_URL as string;
    if (!keycloak) {
        throw new Error('KEYCLOAK_URL environment variable must be set');
    }
    const keycloakEndTrimmed = keycloak.endsWith('/') ? keycloak.substr(-1) : keycloak;
    const keycloakURL = keycloakEndTrimmed + keycloakAuthPath;

    return axios.get(keycloakURL as string, {
        headers: {
            'Authorization': keycloakToken
        }
    });
}
  
/**
 * Convert the keycloak token into an openshift token and authenticate nodeApi
 * @param nodeApi The nodeApi given by the devworkspace-client
 * @param keycloakToken The keycloak token sent with the request
 * @returns A promise of the authenticated nodeApi
 */
export async function authenticateOpenShift(nodeApi: IDevWorkspaceClientApi, keycloakToken: string): Promise<IDevWorkspaceClientApi> {
    const openShiftToken = await keycloakToOpenShiftToken(keycloakToken);

    // Create new kubeconfig and authenticate as the user
    const kc = new KubeConfig();
    kc.loadFromClusterAndUser(createCluster(), createUser(openShiftToken));
    
    // Use the newly authenticated user
    nodeApi.config = kc;
    return nodeApi;
}
  
