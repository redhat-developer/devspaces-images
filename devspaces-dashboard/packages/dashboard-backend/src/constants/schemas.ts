/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { JSONSchema7 } from 'json-schema';

import {
  dataResolverSchemaExample,
  devWorkspaceResourcesExample,
  dockerConfigExample,
} from '@/constants/examples';

export const authenticationHeaderSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    authorization: {
      type: 'string',
    },
  },
};

export const namespacedKubeConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    devworkspaceId: {
      type: 'string',
    },
  },
  required: ['namespace', 'devworkspaceId'],
};

export const namespacedWorkspaceSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    workspaceName: {
      type: 'string',
    },
  },
  required: ['namespace', 'workspaceName'],
};

export const namespacedTemplateSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    templateName: {
      type: 'string',
    },
  },
  required: ['namespace', 'templateName'],
};

export const namespacedWorkspacePreferencesSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    provider: {
      type: 'string',
    },
  },
  required: ['namespace', 'provider'],
};

export const namespacedSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
  },
  required: ['namespace'],
};

export const dwTemplatePatchSchema: JSONSchema7 = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      op: { type: 'string' },
      path: { type: 'string' },
      value: {}, // matches any value
    },
  },
  examples: [
    [
      {
        op: 'replace',
        path: '/spec/commands',
        value: [],
      },
    ],
  ],
};

export const devworkspacePatchSchema: JSONSchema7 = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      op: { type: 'string' },
      path: { type: 'string' },
      value: {}, // matches any value
    },
  },
  examples: [
    [
      {
        op: 'replace',
        path: '/spec/started',
        value: true,
      },
    ],
  ],
};

export const dockerConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    dockerconfig: {
      type: 'string',
    },
    resourceVersion: {
      type: 'string',
    },
  },
  examples: [dockerConfigExample],
  required: ['dockerconfig'],
};

export const gitConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    gitconfig: {
      type: 'object',
    },
    resourceVersion: {
      type: 'string',
    },
  },
  required: ['gitconfig'],
};

export const devfileVersionSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    version: {
      type: 'string',
      pattern: '^[1-2]\\.[0-2]\\.[0-2](?:-alpha)?$',
    },
  },
  required: ['version'],
};

export const dataResolverSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      pattern: '^http.*',
    },
  },
  required: ['url'],
  examples: [dataResolverSchemaExample],
};

export const devWorkspaceResourcesSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    devfileContent: {
      type: 'string',
    },
    editorPath: {
      type: 'string',
    },
    pluginRegistryUrl: {
      type: 'string',
    },
    editorEntry: {
      type: 'string',
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          location: {
            type: 'string',
          },
        },
      },
    },
  },
  examples: [devWorkspaceResourcesExample],
};

export const devworkspaceSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    devworkspace: {
      type: 'object',
    },
  },
  required: ['devworkspace'],
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
              },
            },
          },
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
                      type: 'array',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const personalAccessTokenBodySchema: JSONSchema7 = {
  type: 'object',
  properties: {
    cheUserId: {
      type: 'string',
    },
    tokenName: {
      type: 'string',
    },
    tokenData: {
      type: 'string',
    },
    gitProviderEndpoint: {
      type: 'string',
    },
    gitProvider: {
      type: 'string',
    },
    gitProviderOrganization: {
      type: 'string',
    },
  },
  required: ['cheUserId', 'tokenName', 'tokenData', 'gitProviderEndpoint', 'gitProvider'],
};

export const personalAccessTokenParamsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    tokenName: {
      type: 'string',
    },
  },
  required: ['namespace', 'tokenName'],
};

export const sshKeyBodySchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    key: {
      type: 'string',
    },
    keyPub: {
      type: 'string',
    },
  },
  required: ['name', 'key', 'keyPub'],
};

export const sshKeyParamsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    namespace: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['namespace', 'name'],
};
