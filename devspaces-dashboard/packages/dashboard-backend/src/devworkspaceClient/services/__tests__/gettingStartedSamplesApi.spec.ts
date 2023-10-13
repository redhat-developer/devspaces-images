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

import { api } from '@eclipse-che/common';
import * as mockClient from '@kubernetes/client-node';

import { GettingStartedSamplesApiService } from '@/devworkspaceClient/services/gettingStartedSamplesApi';

describe('Getting Started Samples API Service', () => {
  const env = process.env;
  let gettingStartedSample: GettingStartedSamplesApiService;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      CHECLUSTER_CR_NAMESPACE: 'eclipse-che',
    };

    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(() => {
      return {
        listNamespacedConfigMap: () => {
          return Promise.resolve({
            body: { items: [{ data: { mySample: JSON.stringify(getGettingStartedSample()) } }] },
          });
        },
      };
    });

    gettingStartedSample = new GettingStartedSamplesApiService(kubeConfig);
  });

  afterEach(() => {
    process.env = env;
    jest.clearAllMocks();
  });

  test('fetching metadata', async () => {
    const res = await gettingStartedSample.list();
    expect(res).toEqual([getGettingStartedSample()]);
  });
});

function getGettingStartedSample(): api.IGettingStartedSample {
  return {
    displayName: 'Eclipse Che Dashboard',
    description: 'Specifies development environment needed to develop the Eclipse Che Dashboard.',
    tags: ['Eclipse Che', 'Dashboard'],
    url: 'https://github.com/che-incubator/quarkus-api-example/',
    icon: {
      base64data: 'base64-encoded-data',
      mediatype: 'image/png',
    },
  };
}
