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

import { ValidatedOptions } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { GitConfigUserName } from '..';

jest.mock('@/components/InputGroupExtended');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitConfigUserName', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot, not loading', () => {
    const snapshot = createSnapshot('user one', false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot, loading', () => {
    const snapshot = createSnapshot('user one', true);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should fail validation if value is empty', async () => {
    renderComponent('user one', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.clear(textInput);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should fail validation if value is too long', async () => {
    renderComponent('user one', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste('a'.repeat(129));

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should re-validate on component update', () => {
    const { reRenderComponent } = renderComponent('', false);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);

    reRenderComponent('valid name', false);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.default);
  });

  it('should handle value changing', async () => {
    renderComponent('user one', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste(' two');

    expect(mockOnChange).toHaveBeenCalledWith('user one two', true);
  });
});

function getComponent(value: string, isLoading: boolean): React.ReactElement {
  return <GitConfigUserName isLoading={isLoading} value={value} onChange={mockOnChange} />;
}
