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

import { ApplicationId } from '@eclipse-che/common';
import { FastifyInstance } from 'fastify';
import { baseApiPath } from '../../../constants/config';
import { setup, teardown } from '../../../helpers/tests/appBuilder';

describe('Cluster Info Route', () => {
  let app: FastifyInstance;
  const clusterConsoleUrl = 'cluster-console-url';

  beforeAll(async () => {
    const env = {
      OPENSHIFT_CONSOLE_URL: clusterConsoleUrl,
    };
    app = await setup({ env });
  });

  afterAll(() => {
    teardown(app);
  });

  test('response payload', async () => {
    const res = await app.inject({
      url: `${baseApiPath}/cluster-info`,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({
      applications: [
        {
          icon: `${clusterConsoleUrl}/static/assets/redhat.svg`,
          title: 'OpenShift console',
          url: clusterConsoleUrl,
          id: ApplicationId.CLUSTER_CONSOLE,
        },
      ],
    });
  });
});
