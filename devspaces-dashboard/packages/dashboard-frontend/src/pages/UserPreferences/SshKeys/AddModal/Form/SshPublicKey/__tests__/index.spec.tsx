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

import getComponentRenderer, { fireEvent, screen } from '@/services/__mocks__/getComponentRenderer';

import { MAX_LENGTH_ERROR, REQUIRED_ERROR, SshPublicKey, WRONG_TYPE_ERROR } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

jest.mock('@/components/TextFileUpload');

describe('SshPublicKey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('file upload', () => {
    it('should handle SSH public key', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PUBLIC key');

      const sshPublicKey = 'ssh-public-key';
      await userEvent.click(input);
      await userEvent.paste(sshPublicKey);

      const expectedSshPrivateKey = btoa(sshPublicKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPrivateKey, true);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle the wrong file type', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PUBLIC key');

      // fill the SSH public key field
      await userEvent.click(input);
      await userEvent.paste('ssh-public-key');

      mockOnChange.mockClear();

      // clear the SSH public key field
      const sshPublicKey = '';
      fireEvent.change(input, { target: { value: sshPublicKey } });

      expect(mockOnChange).toHaveBeenCalledWith('', false);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeTruthy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle large file', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PUBLIC key');

      // fill the SSH public key field
      const sshPublicKey = 'ssh-public-key'.repeat(1000);
      await userEvent.click(input);
      await userEvent.paste(sshPublicKey);

      const expectedSshPublicKey = btoa(sshPublicKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPublicKey, false);
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeTruthy();
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
    });
  });

  describe('text area', () => {
    it('should handle SSH public key', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PUBLIC key');

      const sshPublicKey = 'ssh-key-data';
      await userEvent.click(input);
      await userEvent.paste(sshPublicKey);

      const expectedSshPublicKey = btoa(sshPublicKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPublicKey, true);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle the empty value', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PUBLIC key');

      // fill the SSH key data field
      await userEvent.click(input);
      await userEvent.paste('ssh-key-data');

      mockOnChange.mockClear();

      // clear the SSH key data field
      await userEvent.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('', false);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeTruthy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle large file', async () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PUBLIC key');

      // fill the SSH key data field
      const sshPublicKey = 'ssh-key-data'.repeat(1000);
      await userEvent.click(input);
      await userEvent.paste(sshPublicKey);

      const expectedSshPublicKey = btoa(sshPublicKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPublicKey, false);
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeTruthy();
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
    });
  });
});

function getComponent(): React.ReactElement {
  return (
    <Form>
      <SshPublicKey onChange={mockOnChange} />
    </Form>
  );
}
