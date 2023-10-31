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

import { sshKey1, sshKey2 } from '@/pages/UserPreferences/SshKeys/__tests__/stub';
import getComponentRenderer, { screen, within } from '@/services/__mocks__/getComponentRenderer';

import { Props, SshKeysList } from '..';

jest.mock('../Entry');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('SSH keys list', () => {
  const props: Props = {
    sshKeys: [sshKey1, sshKey2],
    onDeleteSshKeys: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(props);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should display the SSH keys', () => {
    renderComponent(props);

    const entries = screen.getAllByTestId('ssh-keys-list-entry');

    expect(entries).toHaveLength(2);

    expect(within(entries[0]).getByText(sshKey1.name)).toBeInTheDocument();
    expect(within(entries[1]).getByText(sshKey2.name)).toBeInTheDocument();
  });

  it('should delete the SSH key', () => {
    renderComponent(props);

    const entries = screen.getAllByTestId('ssh-keys-list-entry');

    const deleteButton = within(entries[0]).getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeInTheDocument();

    deleteButton.click();

    expect(props.onDeleteSshKeys).toHaveBeenCalledWith([sshKey1]);
  });
});

function getComponent(props: Props): React.ReactElement {
  return <SshKeysList {...props} />;
}
