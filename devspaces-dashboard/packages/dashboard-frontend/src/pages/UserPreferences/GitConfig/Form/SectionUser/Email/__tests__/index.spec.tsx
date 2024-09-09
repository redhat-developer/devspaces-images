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

import { GitConfigUserEmail } from '..';

jest.mock('@/components/InputGroupExtended');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitConfigUserEmail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot, not loading', () => {
    const snapshot = createSnapshot('user@che', false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
  test('snapshot', () => {
    const snapshot = createSnapshot('user@che', true);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should fail validation if value is empty', async () => {
    renderComponent('user@che.org', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.clear(textInput);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should fail validation if value is too long', async () => {
    renderComponent('user@che.org', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste('a'.repeat(129));

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should fail validation if is not a valid email', async () => {
    renderComponent('user@che.org', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste('@test');

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should re-validate on component update', () => {
    const { reRenderComponent } = renderComponent('', false);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);

    reRenderComponent('user@che.com', false);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.default);
  });

  it('should handle value changing', async () => {
    renderComponent('user@che.org', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste('a');

    expect(mockOnChange).toHaveBeenCalledWith('user@che.orga', true);
  });
});

function getComponent(value: string, isLoading: boolean): React.ReactElement {
  return <GitConfigUserEmail isLoading={isLoading} value={value} onChange={mockOnChange} />;
}
