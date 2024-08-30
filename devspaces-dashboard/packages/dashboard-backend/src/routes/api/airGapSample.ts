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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getServiceAccountToken } from '@/routes/api/helpers/getServiceAccountToken';
import { getSchema } from '@/services/helpers';

const tags = ['Air Gapped sample'];
const rateLimitConfig = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: '1 minute',
    },
  },
};

export function registerAirGapSampleRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/airgap-sample`,
      Object.assign({}, rateLimitConfig, getSchema({ tags })),
      async () => {
        const token = getServiceAccountToken();
        const { airGapSampleApi } = getDevWorkspaceClient(token);
        return airGapSampleApi.list();
      },
    );

    server.get(
      `${baseApiPath}/airgap-sample/devfile/download`,
      Object.assign({}, rateLimitConfig, getSchema({ tags })),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const sampleId = (request.query as { id: string })['id'];
        if (!sampleId) {
          return reply.status(400).send('Sample id is required.');
        }

        const token = getServiceAccountToken();
        const { airGapSampleApi } = getDevWorkspaceClient(token);

        try {
          const iStreamedFile = await airGapSampleApi.downloadDevfile(sampleId);
          reply.header('Content-Type', 'application/octet-stream');
          reply.header('Content-Length', iStreamedFile.size);
          return reply.send(iStreamedFile.stream);
        } catch (err: any) {
          console.error(`Error downloading file`, err);
          return reply.status(500).send(`Error downloading file`);
        }
      },
    );

    server.get(
      `${baseApiPath}/airgap-sample/project/download`,
      Object.assign({}, rateLimitConfig, getSchema({ tags })),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const sampleId = (request.query as { id: string })['id'];
        if (!sampleId) {
          return reply.status(400).send('Sample id is required.');
        }

        const token = getServiceAccountToken();
        const { airGapSampleApi } = getDevWorkspaceClient(token);

        try {
          const iStreamedFile = await airGapSampleApi.downloadProject(sampleId);
          reply.header('Content-Type', 'application/octet-stream');
          reply.header('Content-Length', iStreamedFile.size);
          return reply.send(iStreamedFile.stream);
        } catch (err: any) {
          console.error(`Error downloading file`, err);
          return reply.status(500).send(`Error downloading file`);
        }
      },
    );
  });
}
