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

import { DwClientProvider } from '../dwClientProvider';

jest.mock('../../../devworkspaceClient');
jest.mock('../kubeConfigProvider.ts');
jest.mock('../../kubeclient/helpers/index.ts', () => {
  return {
    isOpenShift: () => true,
  };
});

describe('DevWorkspace client provider', () => {
  test('getting DevWorkspace client', () => {
    const dwClientProvider = new DwClientProvider();
    expect(dwClientProvider).toBeDefined();

    const dwClient = dwClientProvider.getDWClient('token');
    expect(dwClient).toBeDefined();
  });
});
