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
import { render, screen, waitFor } from '@testing-library/react';
import mockAxios from 'axios';
import { Location } from 'history';
import { dump } from 'js-yaml';
import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import {
  CREATE_DEVWORKSPACE_DELAY,
  CREATE_DEVWORKSPACETEMPLATE_DELAY,
  devfileV2,
  DEVWORKSPACE_RESOURSES_DELAY,
  devworkspaceResources,
  FACTORY_RESOLVER_DELAY,
  factoryResolver,
  namespace,
  PATCH_DEVWORKSPACE_DELAY,
  plugins,
  targetDevWorkspace,
  targetDevWorkspaceTemplate,
  TIME_LIMIT,
  url,
} from '@/__tests__/const';
import Fallback from '@/components/Fallback';
import Routes from '@/Routes';
import devfileApi from '@/services/devfileApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ConvertedState } from '@/store/FactoryResolver';

// mute the outputs
console.error = jest.fn();
console.warn = jest.fn();
console.debug = jest.fn();

describe('Workspace creation time', () => {
  const mockGet = mockAxios.get as jest.Mock;
  const mockPatch = mockAxios.patch as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;

  let execTime: number;
  let execTimer: number | undefined = undefined;

  beforeEach(() => {
    execTime = 0;
    execTimer = window.setInterval(() => (execTime += 100), 100);
  });

  afterEach(() => {
    jest.resetAllMocks();
    if (execTimer) {
      clearInterval(execTimer);
    }
  });

  it('should be less then the TIME_LIMIT', async () => {
    mockPost.mockResolvedValueOnce(
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              data: factoryResolver,
            }),
          FACTORY_RESOLVER_DELAY,
        ),
      ),
    );

    const { rerender } = render(
      getComponent(
        `/load-factory?url=${url}`,
        new FakeStoreBuilder().withInfrastructureNamespace([namespace]).build(),
      ),
    );

    await waitFor(
      () => expect(mockPost).toBeCalledWith('/api/factory/resolver', expect.anything()),
      { timeout: 8000 },
    );
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockPatch).not.toHaveBeenCalled();
    expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();

    mockPost.mockClear();
    mockPost.mockResolvedValueOnce(
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              data: devworkspaceResources,
            }),
          DEVWORKSPACE_RESOURSES_DELAY,
        ),
      ),
    );
    mockPost.mockResolvedValueOnce(
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              data: Object.assign({}, targetDevWorkspace, {
                metadata: {
                  name: 'che-dashboard',
                  namespace: namespace.name,
                  uid: 'che-dashboard-test-uid',
                  labels: {},
                },
              }),
              headers: {},
            }),
          CREATE_DEVWORKSPACE_DELAY,
        ),
      ),
    );
    mockPost.mockResolvedValueOnce(
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              data: targetDevWorkspaceTemplate,
              headers: {},
            }),
          CREATE_DEVWORKSPACETEMPLATE_DELAY,
        ),
      ),
    );

    mockPatch.mockResolvedValueOnce(
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              data: targetDevWorkspace,
            }),
          PATCH_DEVWORKSPACE_DELAY,
        ),
      ),
    );

    rerender(
      getComponent(
        `/load-factory?url=${url}`,
        new FakeStoreBuilder()
          .withInfrastructureNamespace([namespace])
          .withFactoryResolver({
            resolver: Object.assign(
              { location: 'https://github.com/eclipse-che/che-dashboard' },
              factoryResolver,
            ),
            converted: {
              isConverted: false,
              devfileV2: devfileV2,
            } as ConvertedState,
          })
          .withDwServerConfig({
            defaults: {
              editor: 'che-incubator/che-code/insiders',
            },
            pluginRegistryURL: 'http://localhost/plugin-registry/v3',
          } as api.IServerConfig)
          .withDwPlugins(plugins)
          .withDevfileRegistries({
            devfiles: {
              ['http://localhost/plugin-registry/v3/plugins/che-incubator/che-code/insiders/devfile.yaml']:
                {
                  content: dump({
                    schemaVersion: '2.2.0',
                    metadata: {
                      name: 'che-code',
                    },
                  } as devfileApi.Devfile),
                },
            },
          })
          .build(),
      ),
    );

    await waitFor(
      () =>
        expect(mockPost.mock.calls).toEqual([
          expect.arrayContaining(['/dashboard/api/devworkspace-resources']),
          expect.arrayContaining([`/dashboard/api/namespace/${namespace.name}/devworkspaces`]),
          expect.arrayContaining([
            `/dashboard/api/namespace/${namespace.name}/devworkspacetemplates`,
          ]),
        ]),
      { timeout: 1500 },
    );
    expect(mockPost).toBeCalledTimes(3);

    await waitFor(
      () =>
        expect(mockPatch.mock.calls).toEqual([
          expect.arrayContaining([
            `/dashboard/api/namespace/${namespace.name}/devworkspaces/${targetDevWorkspace.metadata.name}`,
          ]),
        ]),
      { timeout: 1500 },
    );
    expect(mockPatch).toBeCalledTimes(1);
    expect(mockGet).not.toBeCalled();
    expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();

    expect(execTime).toBeLessThan(TIME_LIMIT);
  }, 15000);
});

function getComponent(
  locationOrPath: Location | string,
  store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>,
): React.ReactElement {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[locationOrPath]}>
        <Suspense fallback={Fallback}>
          <Routes />
        </Suspense>
      </MemoryRouter>
    </Provider>
  );
}
