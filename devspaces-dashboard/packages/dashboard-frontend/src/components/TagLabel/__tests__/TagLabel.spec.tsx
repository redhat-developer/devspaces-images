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
import TagLabel from '..';

describe('TagLabel component', () => {
  it('should render latest latest correctly', () => {
    const component = <TagLabel version="latest" />;

    expect(getComponentSnapshot(component)).toMatchSnapshot();
  });

  it('should render next tag correctly', () => {
    const component = <TagLabel version="next" />;

    expect(getComponentSnapshot(component)).toMatchSnapshot();
  });
});

function getComponentSnapshot(
  component: React.ReactElement,
): null | ReactTestRendererJSON | ReactTestRendererJSON[] {
  return renderer.create(component).toJSON();
}
