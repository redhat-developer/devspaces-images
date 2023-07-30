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
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AddEditModalForm } from '..';
import getComponentRenderer, {
  screen,
} from '../../../../../../services/__mocks__/getComponentRenderer';
import { EditTokenProps } from '../../../types';
import {
  NEW_GIT_PROVIDER_ENDPOINT,
  INVALID_GIT_PROVIDER_ENDPOINT,
  INVALID_GIT_PROVIDER_ENDPOINT_BUTTON,
  NEW_GIT_PROVIDER_ENDPOINT_BUTTON,
} from '../GitProviderEndpoint/__mocks__';
import {
  NEW_GIT_PROVIDER_ORGANIZATION,
  INVALID_GIT_PROVIDER_ORGANIZATION,
  NEW_GIT_PROVIDER_ORGANIZATION_BUTTON,
  INVALID_GIT_PROVIDER_ORGANIZATION_BUTTON,
} from '../GitProviderOrganization/__mocks__';
import {
  INVALID_TOKEN_DATA,
  INVALID_TOKEN_DATA_BUTTON,
  NEW_TOKEN_DATA,
  NEW_TOKEN_DATA_BUTTON,
} from '../TokenData/__mocks__';
import {
  INVALID_TOKEN_NAME,
  INVALID_TOKEN_NAME_BUTTON,
  NEW_TOKEN_NAME,
  NEW_TOKEN_NAME_BUTTON,
} from '../TokenName/__mocks__';

jest.mock('../GitProviderEndpoint');
jest.mock('../GitProviderOrganization');
jest.mock('../GitProviderSelector');
jest.mock('../TokenName');
jest.mock('../TokenData');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

const cheUserId = 'che-user';
const tokenName = 'token-name';
const tokenData = 'token-data';
const gitProvider = 'github';
const gitProviderEndpoint = 'git-provider-endpoint';
const gitProviderOrganization = 'git-provider-organization';

describe('AddEditModalForm', () => {
  let pat: api.PersonalAccessToken;
  let patWithOrganization: api.PersonalAccessToken;

  beforeEach(() => {
    pat = {
      cheUserId,
      tokenName,
      tokenData,
      gitProvider,
      gitProviderEndpoint,
    };
    patWithOrganization = {
      ...pat,
      gitProvider: 'azure-devops',
      gitProviderOrganization,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render GitHub personal access token', () => {
    renderComponent({ isEdit: true, token: pat });

    // token name
    expect(screen.queryByTestId('token-name')).toBeTruthy();

    // git provider
    expect(screen.queryByTestId('git-provider')).toBeTruthy();

    // git provider endpoint
    expect(screen.queryByTestId('git-provider-endpoint')).toBeTruthy();

    // there should not be the organization field
    expect(screen.queryByTestId('git-provider-organization')).toBeFalsy();

    // token data
    expect(screen.queryByTestId('token-data')).toBeTruthy();
  });

  it('should render Azure DevOps personal access token', () => {
    renderComponent({ isEdit: true, token: patWithOrganization });

    // token name
    expect(screen.queryByTestId('token-name')).toBeTruthy();

    // git provider
    expect(screen.queryByTestId('git-provider')).toBeTruthy();

    // git provider endpoint
    expect(screen.queryByTestId('git-provider-endpoint')).toBeTruthy();

    // there should not be the organization field
    expect(screen.queryByTestId('git-provider-organization')).toBeTruthy();

    // token data
    expect(screen.queryByTestId('token-data')).toBeTruthy();
  });

  describe('Git provider', () => {
    it('should handle changing the git provider', () => {
      renderComponent({ isEdit: false, token: undefined });

      // git provider name field
      const gitProviderButton = screen.getByRole('button', {
        name: 'Submit Provider GitHub',
      });
      userEvent.click(gitProviderButton);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cheUserId,
          gitProvider: 'github',
        }),
        false,
      );
    });

    it('should reveal the git organization field', () => {
      renderComponent({ isEdit: true, token: pat });

      // expect there is no organization field
      expect(screen.queryByTestId('git-provider-organization')).toBeFalsy();

      const gitProviderButton = screen.getByRole('button', {
        name: 'Submit Provider Azure DevOps',
      });
      userEvent.click(gitProviderButton);

      // expect there is the organization field
      () => expect(screen.queryByTestId('git-provider-organization')).toBeTruthy();
    });

    it('should hide the git organization field', () => {
      renderComponent({ isEdit: true, token: patWithOrganization });

      // expect the organization field is visible
      () => expect(screen.queryByTestId('git-provider-organization')).toBeTruthy();

      // git provider name field
      const gitProviderButton = screen.getByRole('button', {
        name: 'Submit Provider GitHub',
      });
      userEvent.click(gitProviderButton);

      // expect there is no organization field
      () => expect(screen.queryByTestId('git-provider-organization')).toBeFalsy();
    });

    it('should hide the git organization field and re-validate the form', () => {
      renderComponent({ isEdit: true, token: patWithOrganization });

      // invalidate the form
      const gitProviderOrganizationButton = screen.getByRole('button', {
        name: 'Submit Invalid Git Provider Organization',
      });
      userEvent.click(gitProviderOrganizationButton);

      // expect mockOnChange was called with invalid form
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gitProviderOrganization: INVALID_GIT_PROVIDER_ORGANIZATION,
        }),
        false,
      );
      mockOnChange.mockClear();

      // git provider name field
      const gitProviderButton = screen.getByRole('button', {
        name: 'Submit Provider GitHub',
      });
      userEvent.click(gitProviderButton);

      // expect mockOnChange was called with valid form
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.not.objectContaining({
          gitProviderOrganization: expect.any(String),
        }),
        true,
      );
    });
  });

  describe('Git provider endpoint', () => {
    it('should handle changing the git provider endpoint to a valid value', () => {
      renderComponent({ isEdit: true, token: pat });

      // git provider endpoint field
      const gitProviderEndpointField = screen.getByRole('button', {
        name: NEW_GIT_PROVIDER_ENDPOINT_BUTTON,
      });
      userEvent.click(gitProviderEndpointField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          gitProviderEndpoint: NEW_GIT_PROVIDER_ENDPOINT,
        }),
        true,
      );
    });

    it('should handle changing the git provider endpoint to an invalid value', () => {
      renderComponent({ isEdit: true, token: pat });

      // git provider endpoint field
      const gitProviderEndpointField = screen.getByRole('button', {
        name: INVALID_GIT_PROVIDER_ENDPOINT_BUTTON,
      });
      userEvent.click(gitProviderEndpointField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          gitProviderEndpoint: INVALID_GIT_PROVIDER_ENDPOINT,
        }),
        false,
      );
    });

    it('should use the default git provider endpoint', () => {
      renderComponent({ isEdit: false, token: undefined });

      // change other field to trigger onChange event
      const tokenNameField = screen.getByRole('button', {
        name: 'Submit Valid Token Name',
      });
      userEvent.click(tokenNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gitProviderEndpoint: 'https://github.com',
        }),
        false,
      );

      // change other field to trigger onChange event
      const gitProviderButton = screen.getByRole('button', {
        name: 'Submit Provider Azure DevOps',
      });
      userEvent.click(gitProviderButton);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gitProviderEndpoint: 'https://dev.azure.com',
        }),
        false,
      );
    });
  });

  describe('Git provider organization', () => {
    it('should handle changing the git provider organization to a valid value', () => {
      renderComponent({ isEdit: true, token: patWithOrganization });

      // git provider name field
      const gitProviderOrganizationField = screen.getByRole('button', {
        name: NEW_GIT_PROVIDER_ORGANIZATION_BUTTON,
      });
      userEvent.click(gitProviderOrganizationField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gitProviderOrganization: NEW_GIT_PROVIDER_ORGANIZATION,
        }),
        true,
      );
    });

    it('should handle changing the git provider organization to a an invalid value', () => {
      renderComponent({ isEdit: true, token: patWithOrganization });

      // git provider name field
      const gitProviderOrganizationField = screen.getByRole('button', {
        name: INVALID_GIT_PROVIDER_ORGANIZATION_BUTTON,
      });
      userEvent.click(gitProviderOrganizationField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gitProviderOrganization: INVALID_GIT_PROVIDER_ORGANIZATION,
        }),
        false,
      );
    });
  });

  describe('Token Name', () => {
    it('should handle a valid value', () => {
      renderComponent({ isEdit: true, token: pat });

      // token name field
      const tokenNameField = screen.getByRole('button', {
        name: NEW_TOKEN_NAME_BUTTON,
      });
      userEvent.click(tokenNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenName: NEW_TOKEN_NAME,
        }),
        true,
      );
    });

    it('should handle an invalid value', () => {
      renderComponent({ isEdit: true, token: pat });

      // token name field
      const tokenNameField = screen.getByRole('button', {
        name: INVALID_TOKEN_NAME_BUTTON,
      });
      userEvent.click(tokenNameField);

      // expect mockOnChange was called
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenName: INVALID_TOKEN_NAME,
        }),
        false,
      );
    });
  });

  describe('Token Data', () => {
    describe('in add mode', () => {
      it('should handle a valid value', () => {
        renderComponent({ isEdit: false, token: undefined });

        // token data field
        const tokenNameField = screen.getByRole('button', {
          name: NEW_TOKEN_DATA_BUTTON,
        });
        userEvent.click(tokenNameField);

        // expect mockOnChange was called
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenData: NEW_TOKEN_DATA,
          }),
          false,
        );
      });

      it('should handle an invalid value', () => {
        renderComponent({ isEdit: false, token: undefined });

        // token data field
        const tokenNameField = screen.getByRole('button', {
          name: INVALID_TOKEN_DATA_BUTTON,
        });
        userEvent.click(tokenNameField);

        // expect mockOnChange was called
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenData: INVALID_TOKEN_DATA,
          }),
          false,
        );
      });
    });

    describe('in edit mode', () => {
      it('should handle a valid value', () => {
        renderComponent({ isEdit: true, token: pat });

        // token data field
        const tokenNameField = screen.getByRole('button', {
          name: NEW_TOKEN_DATA_BUTTON,
        });
        userEvent.click(tokenNameField);

        // expect mockOnChange was called
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenData: NEW_TOKEN_DATA,
          }),
          true,
        );
      });

      it('should ignore an invalid value', () => {
        renderComponent({ isEdit: true, token: pat });

        // token data field
        const tokenNameField = screen.getByRole('button', {
          name: INVALID_TOKEN_DATA_BUTTON,
        });
        userEvent.click(tokenNameField);

        // expect mockOnChange was called
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenData: pat.tokenData,
          }),
          true,
        );
      });
    });
  });
});

function getComponent(props: EditTokenProps) {
  return <AddEditModalForm cheUserId={cheUserId} onChange={mockOnChange} {...props} />;
}
