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

import { api } from '@eclipse-che/common';
import { TooltipProps } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { Props, SshKeysListEntry } from '..';

jest.mock('@/services/helpers/dates', () => {
  return {
    getFormattedDate: () => 'Aug 27, 4:17 p.m.',
  };
});

// mock the React.Tooltip component
jest.mock('@patternfly/react-core', () => {
  return {
    ...jest.requireActual('@patternfly/react-core'),
    Tooltip: (obj: TooltipProps) => {
      return (
        <div>
          <span>{obj.content}</span>
          {obj.children}
        </div>
      );
    },
  };
});

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('SshKeysListEntry', () => {
  const sshKey: api.SshKey = {
    name: 'sshKey1',
    keyPub: btoa('ssh-public-key'),
    creationTimestamp: new Date('2020-08-27T13:17:34.000Z'),
  };

  const props: Props = {
    sshKey,
    onDeleteSshKey: jest.fn(),
  };

  afterAll(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(props);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should display the SSH key name', () => {
    renderComponent(props);
    expect(screen.queryByTestId('title')).toHaveTextContent(sshKey.name);
  });

  it('should display the SSH key creation date', () => {
    renderComponent(props);
    expect(screen.queryByTestId('added-on')).toHaveTextContent('Added: Aug 27, 4:17 p.m.');
  });

  describe('dropdown', () => {
    it('should display the dropdown', () => {
      renderComponent(props);
      expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeNull();
    });

    it('should reveal the Delete button', () => {
      renderComponent(props);
      const dropdown = screen.getByRole('button', { name: 'Actions' });
      userEvent.click(dropdown);

      const deleteItem = screen.queryByRole('menuitem', { name: 'Delete' });
      expect(deleteItem).not.toBeNull();

      userEvent.click(deleteItem!);
      expect(props.onDeleteSshKey).toHaveBeenCalledWith(sshKey);
    });
  });

  describe('copy to clipboard', () => {
    it('should display the Copy to Clipboard button', () => {
      renderComponent(props);
      expect(screen.queryByTestId('copy-to-clipboard')).not.toBeNull();
    });

    it('should copy the SSH key to the clipboard', async () => {
      window.prompt = jest.fn();
      jest.useFakeTimers();

      renderComponent(props);
      const copyToClipboard = screen.getByTestId('copy-to-clipboard');

      // initial tooltip state
      expect(screen.queryByText('Copied!')).toBeNull();
      expect(screen.queryByText('Copy to clipboard')).not.toBeNull();

      userEvent.click(copyToClipboard);

      // 500ms after click
      await jest.advanceTimersByTimeAsync(500);
      expect(screen.queryByText('Copied!')).not.toBeNull();
      expect(screen.queryByText('Copy to clipboard')).toBeNull();

      userEvent.click(copyToClipboard);

      // 1000ms after after the second click
      await jest.advanceTimersByTimeAsync(500);
      expect(screen.queryByText('Copied!')).not.toBeNull();
      expect(screen.queryByText('Copy to clipboard')).toBeNull();

      // 5000 after the last click
      await jest.advanceTimersByTimeAsync(5000);
      expect(screen.queryByText('Copied!')).toBeNull();
      expect(screen.queryByText('Copy to clipboard')).not.toBeNull();
    });
  });
});

function getComponent(props: Props) {
  return <SshKeysListEntry {...props} />;
}
