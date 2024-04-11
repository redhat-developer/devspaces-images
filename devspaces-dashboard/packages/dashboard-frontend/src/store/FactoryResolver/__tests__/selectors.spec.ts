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

import devfileApi from '@/services/devfileApi';
import { AppState } from '@/store';
import {
  selectFactoryResolver,
  selectFactoryResolverError,
} from '@/store/FactoryResolver/selectors';
import { State } from '@/store/FactoryResolver/types';

describe('FactoryResolver, selectors', () => {
  test('selectFactoryResolver', () => {
    const state = {
      resolver: {
        devfile: {
          schemaVersion: '2.2.2',
        } as devfileApi.Devfile,
      },
      isLoading: false,
    } as State;

    const resolver = selectFactoryResolver({ factoryResolver: state } as AppState);

    expect(resolver).toEqual(state.resolver);
  });

  test('selectFactoryResolverError', () => {
    const state = {
      error: 'error',
      isLoading: false,
    } as State;

    const error = selectFactoryResolverError({ factoryResolver: state } as AppState);

    expect(error).toEqual(state.error);
  });
});
