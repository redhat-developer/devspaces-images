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

import { FastifyInstance } from 'fastify';
import fastifySwagger from 'fastify-swagger';

const routePrefix = 'dashboard/api/swagger';

export function registerSwagger(server: FastifyInstance): void {
  console.log(`Che Dashboard swagger is running on "${routePrefix}".`);

  server.register(fastifySwagger, {
    routePrefix,
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
    transform: (schema: any) => {
      if (schema?.headers?.properties?.authorization) {
        delete schema?.headers?.properties?.authorization;
      }
      return schema;
    },
  });
}
