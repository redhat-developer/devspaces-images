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
import userEvent from '@testing-library/user-event';
import React from 'react';
import { GitProviderOrganization } from '..';
import getComponentRenderer, {
  screen,
} from '../../../../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitProviderOrganization', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o organization', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with organization', () => {
    const snapshot = createSnapshot('user-organization');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle a correct organization', () => {
    const organization = 'user-organization';
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, organization);

    expect(mockOnChange).toHaveBeenCalledWith(organization, true);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Provider Organization is too long./)).toBeFalsy();
  });

  it('should handle a too long organization value', () => {
    // make it long enough to be invalid
    const organization = 'user-organization'.repeat(20);
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, organization);

    expect(mockOnChange).toHaveBeenCalledWith(organization, false);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Provider Organization is too long./)).toBeTruthy();
  });

  it('should handle an empty value', () => {
    const organization = 'user-organization';
    renderComponent(organization);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.clear(input);

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
    expect(screen.queryByText(/^The Provider Organization is too long./)).toBeFalsy();
  });
});

function getComponent(providerOrganization?: string): React.ReactElement {
  return (
    <Form>
      <GitProviderOrganization
        providerOrganization={providerOrganization}
        onChange={mockOnChange}
      />
    </Form>
  );
}
