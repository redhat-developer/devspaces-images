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
import { StateMock } from '@react-mock/state';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import {
  GitConfigUserEmail,
  State,
} from '@/pages/UserPreferences/GitConfig/Form/SectionUser/Email';
import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';

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

  it('should reset validation', async () => {
    const localState: Partial<State> = {
      value: '',
      validated: ValidatedOptions.error,
    };
    const { reRenderComponent } = renderComponent('user@che.org', true, localState);

    reRenderComponent('user@che.org', false, localState);

    await waitFor(() =>
      expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.default),
    );
  });

  it('should handle value changing', async () => {
    renderComponent('user@che.org', false);

    const textInput = screen.getByRole('textbox');
    await userEvent.click(textInput);
    await userEvent.paste('a');

    expect(mockOnChange).toHaveBeenCalledWith('user@che.orga', true);
  });
});

function getComponent(
  value: string,
  isLoading: boolean,
  localState?: Partial<State>,
): React.ReactElement {
  if (localState) {
    return (
      <StateMock state={localState}>
        <GitConfigUserEmail isLoading={isLoading} value={value} onChange={mockOnChange} />
      </StateMock>
    );
  }
  return <GitConfigUserEmail isLoading={isLoading} value={value} onChange={mockOnChange} />;
}
