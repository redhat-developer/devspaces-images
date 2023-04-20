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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { baseApiPath } from '../../constants/config';
import { getSchema } from '../../services/helpers';
import { devfileVersionSchema } from '../../constants/schemas';
import { restParams } from '../../models';
import * as devfileSchemaV200 from '../../devfileSchemas/2.0.0/devfile.json';
import * as devfileSchemaV210 from '../../devfileSchemas/2.1.0/devfile.json';
import * as devfileSchemaV220 from '../../devfileSchemas/2.2.0/devfile.json';
import * as devfileSchemaV221Alpha from '../../devfileSchemas/2.2.1-alpha/devfile.json';
import { JSONSchema7 } from 'json-schema';

const tags = ['Devfile'];

type DevfileSchemaV100 = { [key: string]: unknown };

export function registerDevfileSchemaRoute(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/devfile`,
    getSchema({ tags, query: devfileVersionSchema }),
    async function (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<JSONSchema7 | DevfileSchemaV100 | undefined> {
      const { version } = request.query as restParams.IDevfileVersionParams;
      switch (version) {
        case '2.0.0':
          return devfileSchemaV200;
        case '2.1.0':
          return devfileSchemaV210;
        case '2.2.0':
          return devfileSchemaV220;
        case '2.2.1-alpha':
          return devfileSchemaV221Alpha;
      }
      reply.code(404);
    },
  );
}
