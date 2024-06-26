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

import { container } from '@/inversify.config';
import { checkNamespaceProvisionWarnings } from '@/services/bootstrap/namespaceProvisionWarnings';
import { WarningsReporterService } from '@/services/bootstrap/warningsReporter';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const warningsReporterService = container.get(WarningsReporterService);

describe('Check namespace provision warnings', () => {
  afterEach(() => {
    warningsReporterService.clearWarnings();
    jest.clearAllMocks();
  });

  it('should not register any warning', () => {
    let store = new FakeStoreBuilder().build();

    checkNamespaceProvisionWarnings(store.getState);

    expect(warningsReporterService.hasWarning).toBeFalsy();

    store = new FakeStoreBuilder()
      .withDwServerConfig({
        networking: {
          auth: {
            advancedAuthorization: {},
          },
        },
      })
      .build();

    checkNamespaceProvisionWarnings(store.getState);

    expect(warningsReporterService.hasWarning).toBeFalsy();
  });

  it('should register the autoProvision warning', () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig({
        defaultNamespace: {
          autoProvision: false,
        },
      })
      .build();

    checkNamespaceProvisionWarnings(store.getState);

    expect(warningsReporterService.hasWarning).toBeTruthy();
    expect(warningsReporterService.reportAllWarnings()).toEqual([
      {
        key: 'autoProvisionWarning',
        title:
          'Automatic namespace provisioning is disabled. Namespace might not have been configured yet. Please, contact the administrator.',
      },
    ]);
  });
});
