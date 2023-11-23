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

import { ERROR_CODE_ATTR, FACTORY_LINK_ATTR, helpers } from '@eclipse-che/common';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import querystring from 'querystring';

export function registerFactoryAcceptanceRedirect(instance: FastifyInstance): void {
  // redirect to the Dashboard factory flow
  function redirectFactoryFlow(path: string) {
    instance.register(async server => {
      server.get(path, async (request: FastifyRequest, reply: FastifyReply) => {
        let factoryLinkStr = request.url
          .replace(path, '')
          .replace(/^\?/, '')
          .replace(`${FACTORY_LINK_ATTR}%3D`, `${FACTORY_LINK_ATTR}=`);
        if (!factoryLinkStr.includes('=')) {
          factoryLinkStr = decodeURIComponent(factoryLinkStr);
        }
        const query = querystring.parse(factoryLinkStr);
        if (query[FACTORY_LINK_ATTR] !== undefined) {
          // restore the factory link from the query string
          factoryLinkStr = decodeURIComponent(query[FACTORY_LINK_ATTR] as string);
        }

        const params = new URLSearchParams(factoryLinkStr);
        if (query[ERROR_CODE_ATTR] !== undefined) {
          params.append(ERROR_CODE_ATTR, querystring.unescape(query[ERROR_CODE_ATTR] as string));
        }

        const sanitizedQueryParams = helpers.sanitizeSearchParams(params);

        return reply.redirect('/dashboard/#/load-factory?' + sanitizedQueryParams.toString());
      });
    });
  }
  redirectFactoryFlow('/f');
  redirectFactoryFlow('/dashboard/f');
}
