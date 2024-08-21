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

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { MAX_LENGTH_ERROR, REQUIRED_ERROR, SshPrivateKey, WRONG_TYPE_ERROR } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

jest.mock('@/components/TextFileUpload');

describe('SshPrivateKey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('file upload', () => {
    it('should handle SSH private key', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PRIVATE key');

      const sshPrivateKey = 'ssh-private-key';
      userEvent.paste(input, sshPrivateKey);

      const expectedSshPrivateKey = btoa(sshPrivateKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPrivateKey, true);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle the wrong file type', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PRIVATE key');

      userEvent.paste(input, 'ssh-private-key');

      mockOnChange.mockClear();

      const sshPrivateKey = '';
      userEvent.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith(sshPrivateKey, false);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeTruthy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle large file', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Upload the PRIVATE key');

      const sshPrivateKey = 'ssh-private-key'.repeat(5000);
      userEvent.paste(input, sshPrivateKey);

      const expectedSshPrivateKey = btoa(sshPrivateKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPrivateKey, false);
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeTruthy();
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
    });
  });

  describe('text area', () => {
    it('should handle SSH private key', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PRIVATE key');

      // fill the SSH key data field
      const sshPrivateKey = 'ssh-key-data';
      userEvent.paste(input, sshPrivateKey);

      const expectedSshPrivateKey = btoa(sshPrivateKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPrivateKey, true);
      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle the empty value', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PRIVATE key');

      // fill the SSH key data field
      const sshPrivateKey = 'ssh-key-data';
      userEvent.paste(input, sshPrivateKey);

      mockOnChange.mockClear();

      // clear the SSH key data field
      userEvent.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('', false);
      expect(screen.queryByText(REQUIRED_ERROR)).toBeTruthy();

      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeFalsy();
    });

    it('should handle large text content', () => {
      renderComponent();

      expect(mockOnChange).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText('Or paste the PRIVATE key');

      // fill the SSH key data field
      const sshPrivateKey = 'ssh-key-data'.repeat(5000);
      userEvent.paste(input, sshPrivateKey);

      const expectedSshPrivateKey = btoa(sshPrivateKey.trim() + '\n');

      expect(mockOnChange).toHaveBeenCalledWith(expectedSshPrivateKey, false);
      expect(screen.queryByText(MAX_LENGTH_ERROR)).toBeTruthy();

      expect(screen.queryByText(WRONG_TYPE_ERROR)).toBeFalsy();
      expect(screen.queryByText(REQUIRED_ERROR)).toBeFalsy();
    });
  });
});

function getComponent(): React.ReactElement {
  return (
    <Form>
      <SshPrivateKey onChange={mockOnChange} />
    </Form>
  );
}
