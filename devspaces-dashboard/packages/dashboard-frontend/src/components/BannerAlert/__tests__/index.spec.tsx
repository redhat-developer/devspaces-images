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

import { BannerAlert } from '@/components/BannerAlert';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

jest.mock('@/components/BannerAlert/Branding');
jest.mock('@/components/BannerAlert/Custom');
jest.mock('@/components/BannerAlert/NotSupportedBrowser');
jest.mock('@/components/BannerAlert/WebSocket');
jest.mock('@/components/BannerAlert/NoNodeAvailable');

const { createSnapshot } = getComponentRenderer(getComponent);

describe('BannerAlert', () => {
  test('snapshot', () => {
    expect(createSnapshot().toJSON()).toMatchSnapshot();
  });
});

function getComponent() {
  return <BannerAlert />;
}
