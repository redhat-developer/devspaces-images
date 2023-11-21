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

import React from 'react';

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

import ProviderWarning from '..';

describe('ProviderWarning component', () => {
  it('should render ProviderWarning correctly', () => {
    const getComponent = () => <ProviderWarning serverURI={'http://dummy.ref'} />;
    const { createSnapshot } = getComponentRenderer(getComponent);

    expect(createSnapshot().toJSON()).toMatchSnapshot();
  });
});
