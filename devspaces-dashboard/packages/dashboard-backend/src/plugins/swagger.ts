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

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

import { logger } from '@/utils/logger';

const ROUTE_PREFIX = '/dashboard/api/swagger';

type MySchema = {
  headers?: {
    properties?: {
      authorization?: string;
    };
  };
};

export function registerSwagger(server: FastifyInstance) {
  logger.info(`Che Dashboard swagger is running on "${ROUTE_PREFIX}".`);

  server.register(fastifySwagger, {
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
    hideUntagged: true,
    transform: ({ schema, url }) => {
      const mySchema = schema as MySchema;
      if (mySchema?.headers?.properties?.authorization) {
        delete mySchema.headers.properties.authorization;
      }
      return { schema: mySchema, url };
    },
  });

  server.register(fastifySwaggerUi, {
    routePrefix: ROUTE_PREFIX,
    uiConfig: {
      tryItOutEnabled: true,
      validatorUrl: null,
      layout: 'BaseLayout',
    },
  });
}
