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

import { dockerConfigExample } from './examples';
import { JSONSchema7 } from 'json-schema';

export const authenticationHeaderSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    'authorization': {
      type: 'string'
    }
  }
};

export const namespacedDockerConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string'
    }
  },
  required: ['namespace']
};

export const namespacedWorkspaceSchema: JSONSchema7 = {
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

export const namespacedSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string'
    },
  },
  required: ['namespace']
};

export const patchSchema: JSONSchema7 = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      op: { type: 'string' },
      path: { type: 'string' },
      value: {} // matches any value
    },
  }
};

export const dockerConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    dockerconfig: {
      type: 'string'
    },
    resourceVersion: {
      type: 'string'
    }
  },
  examples: [dockerConfigExample],
  required: ['dockerconfig']
};

export const devworkspaceSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    devworkspace: {
      type: 'object'
    }
  },
  required: ['devworkspace']
};

export const templateStartedSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    template: {
      type: 'object',
      properties: {
        apiVersion: { type: 'string' },
        kind: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            template: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                namespace: { type: 'string' },
                ownerReferences: { type: 'array' },
              }
            }
          }
        },
        spec: {
          type: 'object',
          properties: {
            commands: { type: 'array' },
            components: { type: 'array' },
            events: {
              type: 'object',
              properties: {
                template: {
                  type: 'object',
                  properties: {
                    preStart: {
                      type: 'array'
                    }
                  }
                }
              }
            },
          },
        },
      },
    }
  }
};

