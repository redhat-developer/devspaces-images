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

import { GitProviderEndpoint } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

const defaultGitProviderEndpoint = 'https://github.com';

describe('GitProviderEndpoint', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o endpoint', () => {
    const snapshot = createSnapshot(undefined);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with endpoint', () => {
    const snapshot = createSnapshot('https://provider.test/endpoint');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle a correct endpoint', () => {
    const endpoint = 'https://provider.test/endpoint';
    renderComponent(undefined);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, endpoint);

    expect(mockOnChange).toHaveBeenCalledWith(endpoint, true);
    expect(screen.queryByText('The URL is not valid.')).toBeFalsy();
  });

  it('should handle a correct endpoint with the port part', () => {
    const endpoint = 'https://bitbucket.org:8443';
    renderComponent(undefined);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, endpoint);

    expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining(endpoint), true);
    expect(screen.queryByText('The URL is not valid.')).toBeFalsy();
  });

  it('should handle endpoint started with an incorrect protocol', () => {
    const endpoint = 'asdf://provider/endpoint';
    renderComponent(undefined);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, endpoint);

    expect(mockOnChange).toHaveBeenCalledWith(endpoint, false);
    expect(screen.queryByText('The URL is not valid.')).toBeTruthy();
  });

  it('should handle endpoint w/o protocol', () => {
    const endpoint = 'provider/endpoint';
    renderComponent(undefined);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, endpoint);

    expect(mockOnChange).toHaveBeenCalledWith(endpoint, false);
    expect(screen.queryByText('The URL is not valid.')).toBeTruthy();
  });

  it('should handle an empty value', () => {
    const endpoint = 'https://provider.test/endpoint';
    renderComponent(endpoint);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.clear(input);

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
  });

  describe('default endpoint update', () => {
    it('should change value if input untouched', () => {
      const { reRenderComponent } = renderComponent(undefined);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(defaultGitProviderEndpoint);

      const nextDefaultEndpoint = 'https://provider.next/endpoint';
      reRenderComponent(undefined, nextDefaultEndpoint);

      expect(input).toHaveValue(nextDefaultEndpoint);
    });

    it('should not change value if input is modified', () => {
      const { reRenderComponent } = renderComponent(undefined);

      const input = screen.getByRole('textbox');
      const userModifiedEndpoint = 'https://provider.modified/endpoint';
      userEvent.paste(input, userModifiedEndpoint);

      const nextDefaultEndpoint = 'https://provider.next/endpoint';
      reRenderComponent(undefined, nextDefaultEndpoint);

      expect(input).toHaveValue(userModifiedEndpoint);
    });

    it('should not change value if it is provided as param', () => {
      const editEndpoint = 'https://provider.some/endpoint';
      const { reRenderComponent } = renderComponent(editEndpoint);

      const input = screen.getByRole('textbox');

      const nextDefaultEndpoint = 'https://provider.next/endpoint';
      reRenderComponent(editEndpoint, nextDefaultEndpoint);

      expect(input).toHaveValue(editEndpoint);
    });
  });
});

function getComponent(
  providerEndpoint: string | undefined,
  defaultProviderEndpoint = defaultGitProviderEndpoint,
): React.ReactElement {
  return (
    <Form>
      <GitProviderEndpoint
        defaultProviderEndpoint={defaultProviderEndpoint}
        providerEndpoint={providerEndpoint}
        onChange={(...args) => mockOnChange(...args)}
      />
    </Form>
  );
}
