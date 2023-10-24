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

import * as k8s from '@kubernetes/client-node';
import { FastifyInstance } from 'fastify';

import { CheClusterCustomResource } from '@/devworkspaceClient';

import { watchLogLevel } from '..';

const name = 'user-che';
const namespace = 'che-namespace';

let watchCallback: Parameters<k8s.Watch['watch']>[2];
const mockWatch = jest.fn().mockImplementation((...args: Parameters<k8s.Watch['watch']>) => {
  const [, , _callback] = args;
  watchCallback = _callback;
  return Promise.resolve({
    on: jest.fn(),
  }) as ReturnType<k8s.Watch['watch']>;
});

jest.mock('@/devworkspaceClient/services/helpers/prepareCustomObjectWatch', () => {
  return {
    prepareCustomObjectWatch: jest.fn().mockImplementation(() => {
      return {
        watch: jest.fn().mockImplementation(mockWatch),
      };
    }),
  };
});
jest.mock('@/devworkspaceClient', () => {
  const requireActual = jest.requireActual('@/devworkspaceClient');
  return {
    ...requireActual,
    isCheClusterCustomResource: jest.fn().mockImplementation(() => true),
  };
});
jest.mock('@/routes/api/helpers/getServiceAccountToken');

const mockUpdateLogLevel = jest.fn();
jest.mock('@/utils/logger', () => {
  const originalLogger = jest.requireActual('@/utils/logger');
  return {
    ...originalLogger,
    updateLogLevel: (...args: unknown[]) => {
      mockUpdateLogLevel(...args);
    },
  };
});

describe('watchLogLevel', () => {
  beforeEach(() => {
    const env = { CHECLUSTER_CR_NAME: name, CHECLUSTER_CR_NAMESPACE: namespace };
    (process as any).env = env;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should watch the CR and update the log level', async () => {
    const server = {} as FastifyInstance;

    await watchLogLevel(server);

    expect(mockWatch).toBeCalledWith(
      `/apis/org.eclipse.che/v2/namespaces/${namespace}/checlusters`,
      { watch: true },
      expect.any(Function),
      expect.any(Function),
    );

    watchCallback('ADDED', {
      spec: {
        components: {
          dashboard: {
            logLevel: 'DEBUG',
          },
        },
      },
    } as CheClusterCustomResource);

    expect(mockUpdateLogLevel).toBeCalledWith('DEBUG', server);
  });
});
