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

import userEvent from '@testing-library/user-event';
import React from 'react';

import { GitServicesRevokeModal } from '@/pages/UserPreferences/GitServices/RevokeModal';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { IGitOauth } from '@/store/GitOauthConfig/types';

const mockOnRevoke = jest.fn();
const mockOnCancel = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

describe('Revoke Registries Modal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    renderComponent(
      [
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ],
      false,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('modal is shown', async () => {
    renderComponent(
      [
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ],
      true,
    );

    expect(await screen.findByRole('dialog')).not.toBeNull();
  });

  describe('dialog text', () => {
    test('one service selected', () => {
      renderComponent([
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ]);

      const dialogContent = screen.getByTestId('revoke-modal-content');
      expect(dialogContent).toHaveTextContent('Would you like to revoke git service "GitHub"?');
    });

    test('two services selected', () => {
      renderComponent([
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
        {
          name: 'gitlab',
          endpointUrl: 'https://gitlab.com',
        },
      ]);

      const dialogContent = screen.getByTestId('revoke-modal-content');
      expect(dialogContent).toHaveTextContent('Would you like to revoke 2 git services?');
    });
  });

  test('Cancel button', async () => {
    renderComponent([
      {
        name: 'github',
        endpointUrl: 'https://github.com',
      },
    ]);

    const cancelButton = screen.getByTestId('cancel-button');
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  describe('"I understand" checkbox', () => {
    test('with Cancel afterwards', async () => {
      renderComponent([
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ]);

      const checkbox = screen.getByTestId('warning-info-checkbox');

      // not checked by default
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();

      const cancelButton = screen.getByTestId('cancel-button');
      await userEvent.click(cancelButton);

      expect(checkbox).not.toBeChecked();
    });

    test('with Revoke afterwards', async () => {
      renderComponent([
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ]);

      const checkbox = screen.getByTestId('warning-info-checkbox');

      // not checked by default
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();

      const revokeButton = screen.getByTestId('revoke-button');
      await userEvent.click(revokeButton);

      expect(checkbox).not.toBeChecked();
    });
  });

  test('Revoke button', async () => {
    renderComponent([
      {
        name: 'github',
        endpointUrl: 'https://github.com',
      },
    ]);

    const revokeButton = screen.getByTestId('revoke-button');

    // disabled by default
    expect(revokeButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    await userEvent.click(checkbox);

    expect(revokeButton).toBeEnabled();

    await userEvent.click(revokeButton);

    expect(mockOnRevoke).toHaveBeenCalled();
  });
});

function getComponent(selectedItems: IGitOauth[], isOpen = true) {
  return (
    <GitServicesRevokeModal
      isOpen={isOpen}
      selectedItems={selectedItems}
      onCancel={mockOnCancel}
      onRevoke={mockOnRevoke}
    />
  );
}
