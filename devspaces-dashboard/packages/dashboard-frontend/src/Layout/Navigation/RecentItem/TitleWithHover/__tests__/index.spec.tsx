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

import React from 'react';

import { TitleWithHover } from '@/Layout/Navigation/RecentItem/TitleWithHover';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('CheTooltip component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot, active item', () => {
    const snapshot = createSnapshot(true);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot, non-active item', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(isActive: boolean): React.ReactElement {
  return <TitleWithHover text="some-very-long-navigation-item-title" isActive={isActive} />;
}
