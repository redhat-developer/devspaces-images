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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { buildStepName } from '@/components/WorkspaceProgress/CreatingSteps/Fetch/Devfile/buildStepName';
import devfileApi from '@/services/devfileApi';
import {
  buildFactoryParams,
  FACTORY_URL_ATTR,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const factoryUrl = 'https://factory-url';

describe('Factory flow: step Fetch Devfile', () => {
  let searchParams: URLSearchParams;
  let devfile: devfileApi.Devfile;

  beforeEach(() => {
    devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        name: 'my-project',
        namespace: 'user-che',
        generateName: 'my-project-',
      },
    };
    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });
  });

  describe('step title', () => {
    test('direct link to devfile', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile,
            location: factoryUrl,
            source: undefined, // <-
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
      );

      expect(newTitle).toEqual('Devfile found with name "my-project".');
    });

    test('devfile not found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile,
            location: factoryUrl,
            source: 'repo', // <-
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
      );

      expect(newTitle).toEqual(
        `Devfile could not be found in ${factoryUrl}. Applying the default configuration.`,
      );
    });

    test('devfile found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile,
            location: factoryUrl,
            source: 'devfile.yaml', // <-
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
      );

      expect(newTitle).toEqual('Devfile found with name "my-project".');
    });
  });
});
