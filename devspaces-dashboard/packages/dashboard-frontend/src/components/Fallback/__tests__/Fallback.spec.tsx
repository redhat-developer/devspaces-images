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
import renderer, { ReactTestRendererJSON } from 'react-test-renderer';

import Fallback from '..';

describe('React element that is rendered while waiting for the component to load', () => {
  it('should render fallback correctly', () => {
    expect(getComponentSnapshot(Fallback)).toMatchSnapshot();
  });
});

function getComponentSnapshot(
  component: React.ReactElement,
): null | ReactTestRendererJSON | ReactTestRendererJSON[] {
  return renderer.create(component).toJSON();
}
