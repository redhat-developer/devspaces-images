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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import RevokeRegistriesModal from '@/pages/UserPreferences/GitServicesTab/Modals/RevokeGitServicesModal';

describe('Revoke Registries Modal', () => {
  const mockOnRevoke = jest.fn();
  const mockOnCancel = jest.fn();

  function getComponent(
    isRevokeModalOpen: boolean,
    selectedItems: api.GitOauthProvider[],
    gitOauth?: api.GitOauthProvider,
  ): React.ReactElement {
    return (
      <RevokeRegistriesModal
        selectedItems={selectedItems}
        onCancel={mockOnCancel}
        onRevoke={mockOnRevoke}
        isOpen={isRevokeModalOpen}
        gitOauth={gitOauth}
      />
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    const component = getComponent(true, [], 'gitlab');
    render(component);

    const text = screen.queryByText("Would you like to revoke git service 'GitLab'?");
    expect(text).toBeTruthy();

    const checkbox = screen.queryByTestId('warning-info-checkbox');
    expect(checkbox).toBeTruthy();

    const deleteButton = screen.queryByTestId('revoke-button');
    expect(deleteButton).toBeTruthy();

    const cancelButton = screen.queryByTestId('cancel-button');
    expect(cancelButton).toBeTruthy();
  });

  it('should correctly render the component with one selected git service', () => {
    const component = getComponent(true, ['github']);
    render(component);

    const label = screen.queryByText("Would you like to revoke git service 'GitHub'?");
    expect(label).toBeTruthy();
  });

  it('should correctly render the component with two selected git services', () => {
    const component = getComponent(true, ['github', 'gitlab']);
    render(component);

    const label = screen.queryByText('Would you like to revoke 2 git services?');
    expect(label).toBeTruthy();
  });

  it('should fire onRevoke event', () => {
    const component = getComponent(true, ['github']);
    render(component);

    const revokeButton = screen.getByTestId('revoke-button');
    expect(revokeButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);

    expect(revokeButton).toBeEnabled();

    userEvent.click(revokeButton);

    expect(mockOnRevoke).toHaveBeenCalledWith();
  });

  it('should fire onCancel event', () => {
    const component = getComponent(true, ['github', 'gitlab']);
    render(component);

    const deleteButton = screen.getByTestId('revoke-button');
    expect(deleteButton).toBeDisabled();

    const cancelButton = screen.getByTestId('cancel-button');
    userEvent.click(cancelButton);

    expect(mockOnCancel).toBeCalled();
  });
});
