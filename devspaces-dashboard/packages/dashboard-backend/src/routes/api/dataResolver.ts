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

import { baseApiPath } from '@/constants/config';
import { dataResolverSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { axiosInstance } from '@/routes/api/helpers/getCertificateAuthority';
import { getSchema } from '@/services/helpers';

const tags = ['Data Resolver'];

export function registerDataResolverRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.post(
      `${baseApiPath}/data/resolver`,
      getSchema({ tags, body: dataResolverSchema }),
      async function (request: FastifyRequest, reply: FastifyReply): Promise<string | void> {
        const { url } = request.body as restParams.IYamlResolverParams;

        const response = await axiosInstance.get(url, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        });
        reply.code(response.status);
        reply.send(response.data);
        return reply;
      },
    );
  });
}
