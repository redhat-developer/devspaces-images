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

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { GitConfigToolbar } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnAdd = jest.fn();

describe('GitConfigToolbar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('import Git Configuration', () => {
    it('should handle onAdd event', () => {
      renderComponent();

      expect(mockOnAdd).not.toHaveBeenCalled();

      const button = screen.getByRole('button', { name: 'Import Git Configuration' });
      button.click();

      expect(mockOnAdd).toHaveBeenCalled();
    });
  });
});

function getComponent(): React.ReactElement {
  return <GitConfigToolbar onAdd={mockOnAdd} />;
}
