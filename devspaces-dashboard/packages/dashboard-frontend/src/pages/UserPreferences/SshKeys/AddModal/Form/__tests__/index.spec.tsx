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

import { StateMock } from '@react-mock/state';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  INVALID_SSH_PRIVATE_KEY,
  INVALID_SSH_PRIVATE_KEY_BUTTON,
  NEW_SSH_PRIVATE_KEY,
  NEW_SSH_PRIVATE_KEY_BUTTON,
} from '@/pages/UserPreferences/SshKeys/AddModal/Form/SshPrivateKey/__mocks__';
import {
  INVALID_SSH_PUBLIC_KEY,
  INVALID_SSH_PUBLIC_KEY_BUTTON,
  NEW_SSH_PUBLIC_KEY,
  NEW_SSH_PUBLIC_KEY_BUTTON,
} from '@/pages/UserPreferences/SshKeys/AddModal/Form/SshPublicKey/__mocks__';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { AddModalForm, State } from '..';

jest.mock('../SshPrivateKey');
jest.mock('../SshPublicKey');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('AddModalForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SSH Private Key', () => {
    it('should handle a valid value', () => {
      renderComponent({
        publicKey: NEW_SSH_PUBLIC_KEY,
        publicKeyIsValid: true,
      });

      // SSH private key field
      const sshKeyNameField = screen.getByRole('button', {
        name: NEW_SSH_PRIVATE_KEY_BUTTON,
      });
      userEvent.click(sshKeyNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          key: NEW_SSH_PRIVATE_KEY,
        }),
        true,
      );
    });

    it('should handle an invalid value', () => {
      renderComponent({
        publicKey: NEW_SSH_PUBLIC_KEY,
        publicKeyIsValid: true,
      });

      // SSH private key field
      const sshKeyNameField = screen.getByRole('button', {
        name: INVALID_SSH_PRIVATE_KEY_BUTTON,
      });
      userEvent.click(sshKeyNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          key: INVALID_SSH_PRIVATE_KEY,
        }),
        false,
      );
    });
  });

  describe('SSH Public Key', () => {
    it('should handle a valid value', () => {
      renderComponent({
        privateKey: NEW_SSH_PRIVATE_KEY,
        privateKeyIsValid: true,
      });

      // SSH public key field
      const sshKeyNameField = screen.getByRole('button', {
        name: NEW_SSH_PUBLIC_KEY_BUTTON,
      });
      userEvent.click(sshKeyNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPub: NEW_SSH_PUBLIC_KEY,
        }),
        true,
      );
    });

    it('should handle an invalid value', () => {
      renderComponent({
        privateKey: NEW_SSH_PUBLIC_KEY,
        privateKeyIsValid: true,
      });

      // SSH public key field
      const sshKeyNameField = screen.getByRole('button', {
        name: INVALID_SSH_PUBLIC_KEY_BUTTON,
      });
      userEvent.click(sshKeyNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPub: INVALID_SSH_PUBLIC_KEY,
        }),
        false,
      );
    });
  });
});

function getComponent(localState?: Partial<State>) {
  const component = <AddModalForm onChange={mockOnChange} />;
  if (localState) {
    return <StateMock state={localState}>{component}</StateMock>;
  }
  return component;
}
