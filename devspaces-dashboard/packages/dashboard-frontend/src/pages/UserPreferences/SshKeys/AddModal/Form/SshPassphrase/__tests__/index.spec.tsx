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

import { Form } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { SshPassphrase } from '@/pages/UserPreferences/SshKeys/AddModal/Form/SshPassphrase';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

jest.mock('@/components/TextFileUpload');

describe('SshPassphrase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('text area', () => {
    it('should handle SSH passphrase', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Enter passphrase (optional)');
      const passphrase = 'passphrase';
      await userEvent.click(input);
      await userEvent.paste(passphrase);

      expect(mockOnChange).toHaveBeenCalledWith(passphrase);
    });

    it('should handle the empty value', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Enter passphrase (optional)');

      // fill the SSH key data field
      await userEvent.click(input);
      await userEvent.paste('ssh-key-data');

      mockOnChange.mockClear();

      // clear the SSH key data field
      userEvent.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });
});

function getComponent(): React.ReactElement {
  return (
    <Form>
      <SshPassphrase onChange={mockOnChange} />
    </Form>
  );
}
