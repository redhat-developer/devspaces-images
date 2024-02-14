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

import { helpers } from '@eclipse-che/common';
import { AxiosResponse } from 'axios';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { dataResolverSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { axiosInstance, axiosInstanceNoCert } from '@/routes/api/helpers/getCertificateAuthority';
import { getSchema } from '@/services/helpers';

const tags = ['Data Resolver'];

const config = {
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
};

export function registerDataResolverRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.post(
      `${baseApiPath}/data/resolver`,
      getSchema({ tags, body: dataResolverSchema }),
      async function (request: FastifyRequest, reply: FastifyReply): Promise<string | void> {
        const { url } = request.body as restParams.IYamlResolverParams;

        try {
          let response: AxiosResponse;
          try {
            response = await axiosInstanceNoCert.get(url, config);
          } catch (error) {
            if (helpers.errors.includesAxiosResponse(error) && error.response.status === 404) {
              throw error;
            }
            response = await axiosInstance.get(url, config);
          }
          return response.data;
        } catch (error) {
          if (!helpers.errors.includesAxiosResponse(error)) {
            throw error;
          }
          reply.code(error.response.status).send(error.response.data);
        }
      },
    );
  });
}
