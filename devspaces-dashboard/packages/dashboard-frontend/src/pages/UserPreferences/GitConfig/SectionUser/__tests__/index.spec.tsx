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

import * as React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { GitConfigSectionUser, Props } from '..';

jest.mock('../Email');
jest.mock('../Name');

const mockOnChange = jest.fn();

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('GitConfigSectionUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot({
      config: {
        name: 'user',
        email: 'user@che',
      },
      onChange: mockOnChange,
    });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle name change', () => {
    renderComponent({
      config: {
        name: 'user',
        email: 'user@che',
      },
      onChange: mockOnChange,
    });

    screen.getByText('Change Name').click();

    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'new user',
      email: 'user@che',
    });
  });

  it('should handle email change', () => {
    renderComponent({
      config: {
        name: 'user',
        email: 'user@che',
      },
      onChange: mockOnChange,
    });

    screen.getByText('Change Email').click();

    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'user',
      email: 'new-user@che',
    });
  });
});

function getComponent(props: Props): React.ReactElement {
  return <GitConfigSectionUser {...props} />;
}
