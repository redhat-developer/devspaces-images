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

import { Form } from '@patternfly/react-core';
import React from 'react';

import getComponentRenderer, { fireEvent, screen } from '@/services/__mocks__/getComponentRenderer';

import { SshPrivateKey } from '..';

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

  it('should handle SSH private key', () => {
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    const sshPrivateKey = 'ssh-private-key';
    fireEvent.change(input, { target: { value: sshPrivateKey } });

    expect(mockOnChange).toHaveBeenCalledWith(sshPrivateKey, true);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
  });

  it('should handle the empty value', () => {
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    // fill the SSH key data field
    const sshKeyData = 'ssh-key-data';
    fireEvent.change(input, { target: { value: sshKeyData } });

    mockOnChange.mockClear();

    // clear the SSH key data field
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
  });
});

function getComponent(): React.ReactElement {
  return (
    <Form>
      <SshPrivateKey onChange={mockOnChange} />
    </Form>
  );
}
