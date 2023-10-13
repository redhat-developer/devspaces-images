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
import { dump } from 'js-yaml';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import devfileApi from '@/services/devfileApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { selectDefaultDevfile } from '@/store/DevfileRegistries/selectors';

describe('devfileRegistries selectors', () => {
  const registryUrl = 'https://registry-url';
  const sampleResourceUrl = 'https://resources-url';
  const registryMetadata = {
    displayName: 'Empty Workspace',
    description: 'Start an empty remote development environment',
    tags: ['Empty'],
    icon: '/images/empty.svg',
    links: {
      v2: sampleResourceUrl,
    },
  } as che.DevfileMetaData;
  const sampleContent = dump({
    schemaVersion: '2.1.0',
    metadata: {
      generateName: 'empty',
    },
  } as devfileApi.Devfile);
  const defaultComponents = [
    {
      name: 'universal-developer-image',
      container: {
        image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
      },
    },
  ];

  it('should return the default devfile', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDevfileRegistries({
        registries: {
          [registryUrl]: {
            metadata: [registryMetadata],
          },
        },
        devfiles: {
          [sampleResourceUrl]: {
            content: sampleContent,
          },
        },
      })
      .withDwServerConfig({
        defaults: {
          components: defaultComponents,
        },
      } as api.IServerConfig)
      .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
    const state = fakeStore.getState();

    const defaultDevfile = selectDefaultDevfile(state);
    expect(defaultDevfile).toEqual({
      schemaVersion: '2.1.0',
      metadata: {
        generateName: 'empty',
      },
      components: [
        {
          name: 'universal-developer-image',
          container: {
            image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
          },
        },
      ],
    });
  });
});
