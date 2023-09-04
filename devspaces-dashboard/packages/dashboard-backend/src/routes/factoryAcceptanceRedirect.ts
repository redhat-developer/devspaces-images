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

import { FACTORY_LINK_ATTR } from '@eclipse-che/common';
import { sanitizeSearchParams } from '@eclipse-che/common/src/helpers/sanitize';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import querystring from 'querystring';

export function registerFactoryAcceptanceRedirect(instance: FastifyInstance): void {
  // redirect to the Dashboard factory flow
  function redirectFactoryFlow(path: string) {
    instance.register(async server => {
      server.get(path, async (request: FastifyRequest, reply: FastifyReply) => {
        let queryStr = request.url.replace(path, '').replace(/^\?/, '');

        const query = querystring.parse(queryStr);
        if (query[FACTORY_LINK_ATTR] !== undefined) {
          // restore the factory link from the query string
          queryStr = querystring.unescape(query[FACTORY_LINK_ATTR] as string);
        }

        const sanitizedQueryParams = sanitizeSearchParams(new URLSearchParams(queryStr));

        return reply.redirect('/dashboard/#/load-factory?' + sanitizedQueryParams.toString());
      });
    });
  }
  redirectFactoryFlow('/f');
  redirectFactoryFlow('/dashboard/f');
}
