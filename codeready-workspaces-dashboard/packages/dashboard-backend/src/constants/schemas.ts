/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { template } from './examples';

export const authenticationHeaderSchema = {
  type: 'object',
  properties: {
    'authorization': {
      type: 'string'
    }
  }
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
};

export const namespacedSchema = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string'
    },
  },
  required: ['namespace']
};

export const patchSchema = {
  type: 'array',
  example: [{
    op: 'replace',
    path: '/spec/started',
    value: true
  }]
};

export const devworkspaceSchema = {
  type: 'object',
  properties: {
    devworkspace: {
      type: 'object'
    }
  },
  required: ['devworkspace']
};

export const templateStartedSchema = {
  type: 'object',
  properties: {
    template: {
      type: 'object',
      properties: {
        apiVersion: { type: 'string' },
        kind: { type: 'string' },
        metadata: {
          type: 'object',
          template: {
            name: { type: 'string' },
            namespace: { type: 'string' },
            ownerReferences: { type: 'array' },
          }
        },
        spec: {
          type: 'object',
          properties: {
            commands: { type: 'array' },
            components: { type: 'array' },
            events: {
              type: 'object',
              template: {
                preStart: {
                  type: 'array'
                }
              }
            },
          },
        },
      },
      example: template
    }
  }
};

