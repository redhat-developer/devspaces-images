/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

export const authenticationHeaderSchema = {
    type: 'object',
    properties: {
        'authentication': { 
          type: 'string'
        }
    },
    required: ['authentication']
};

export const namespacedWorkspaceSchema = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string'
    },
    workspaceName: {
      type: 'string'
    }
  },
  required: ['namespace', 'workspaceName']
}

export const namespacedSchema = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string'
    },
  },
  required: ['namespace']
}

export const devfileStartedBody = {
  type: 'object',
  properties: {
    devfile: {
      type: 'object'
    },
    started: {
      type: 'boolean'
    }
  },
  required: ['devfile', 'started']
}
