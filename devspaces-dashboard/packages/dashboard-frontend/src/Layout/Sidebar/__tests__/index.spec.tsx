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

import { createMemoryHistory } from 'history';
import React from 'react';

import { Sidebar } from '@/Layout/Sidebar';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

jest.mock('@/Layout/Navigation');

const { createSnapshot } = getComponentRenderer(getComponent);

describe('Sidebar', () => {
  test('snapshot', () => {
    expect(createSnapshot(false, true).toJSON()).toMatchSnapshot();
  });
});

function getComponent(isManaged: boolean, isNavOpen: boolean): React.ReactElement {
  const history = createMemoryHistory();
  return <Sidebar history={history} isManaged={isManaged} isNavOpen={isNavOpen} />;
}
