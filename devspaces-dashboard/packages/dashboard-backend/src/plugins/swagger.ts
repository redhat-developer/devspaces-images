/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';

const ROUTE_PREFIX = '/dashboard/api/swagger';

type MySchema = {
  headers?: {
    properties?: {
      authorization?: string;
    };
  };
};

export function registerSwagger(server: FastifyInstance): void {
  console.log(`Che Dashboard swagger is running on "${ROUTE_PREFIX}".`);

  server.register(fastifySwagger, {
    routePrefix: ROUTE_PREFIX,
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'Che Dashboard Backend Swagger',
        description: 'Testing the Dashboard Backend API',
        version: '0.1.0',
      },
      'x-express-openapi-validation-strict': false,
      components: {
        securitySchemes: {
          Authorization: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    },
    uiConfig: {
      tryItOutEnabled: true,
      validatorUrl: null,
    },
    hideUntagged: true,
    exposeRoute: true,
    transform: ({ schema, url }) => {
      const mySchema = schema as MySchema;
      if (mySchema?.headers?.properties?.authorization) {
        delete mySchema.headers.properties.authorization;
      }
      return { schema: mySchema, url };
    },
  });
}
