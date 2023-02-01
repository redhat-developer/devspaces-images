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

import { authenticationHeaderSchema } from '../constants/schemas';
import { restParams } from '../typings/models';
import createError from '@fastify/error';
import { FastifyError } from 'fastify';

export async function delay(ms = 500): Promise<void> {
  await new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function getSchema(additionalParams: restParams.ISchemaParams): {
  schema: restParams.ISchemaParams;
} {
  const schema = Object.assign(
    {
      headers: authenticationHeaderSchema,
      security: [
        {
          Authorization: '',
        },
      ],
    },
    additionalParams,
  );

  return { schema };
}

type FastifyErrorDescr = Parameters<typeof createError>;
export function createFastifyError(...args: FastifyErrorDescr): FastifyError {
  const FastifyError = createError(...args);
  return new FastifyError();
}
