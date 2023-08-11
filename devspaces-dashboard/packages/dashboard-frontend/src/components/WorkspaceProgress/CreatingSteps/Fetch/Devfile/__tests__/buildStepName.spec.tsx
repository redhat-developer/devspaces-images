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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import devfileApi from '../../../../../../services/devfileApi';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import {
  buildFactoryParams,
  FACTORY_URL_ATTR,
} from '../../../../../../services/helpers/factoryFlow/buildFactoryParams';
import { buildStepName } from '../buildStepName';

const factoryUrl = 'https://factory-url';

describe('Factory flow: step Fetch Devfile', () => {
  let searchParams: URLSearchParams;

  beforeEach(() => {
    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });
  });

  describe('step title', () => {
    test('direct link to devfile', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: undefined, // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
        store.getState().factoryResolver.converted!,
      );

      expect(newTitle).toEqual(`Devfile loaded from ${factoryUrl}.`);
    });

    test('devfile not found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'repo', // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
        store.getState().factoryResolver.converted!,
      );

      expect(newTitle).toEqual(
        `Devfile could not be found in ${factoryUrl}. Applying the default configuration.`,
      );
    });

    test('devfile found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'devfile.yaml', // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
        store.getState().factoryResolver.converted!,
      );

      expect(newTitle).toEqual(`Devfile found in repo ${factoryUrl} as 'devfile.yaml'.`);
    });

    test('devfile converted', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'devfile.yaml',
          },
          converted: {
            isConverted: true, // <-
            devfileV2: {
              schemaVersion: '2.1.0',
            } as devfileApi.Devfile,
          },
        })
        .build();
      const factoryParams = buildFactoryParams(searchParams);

      const newTitle = buildStepName(
        factoryParams.sourceUrl,
        store.getState().factoryResolver.resolver!,
        store.getState().factoryResolver.converted!,
      );

      expect(newTitle).toEqual(
        `Devfile found in repo ${factoryUrl} as 'devfile.yaml'. Devfile version 1 found, converting it to devfile version 2.`,
      );
    });
  });
});
