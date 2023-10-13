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

import { ValidatedOptions } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { GitConfigUserEmail } from '..';

jest.mock('../../../../../../components/InputGroupExtended');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitConfigUserEmail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot('user@che');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should fail validation if value is empty', () => {
    renderComponent('user@che.org');

    const textInput = screen.getByRole('textbox');
    userEvent.clear(textInput);

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should fail validation if value is too long', () => {
    renderComponent('user@che.org');

    const textInput = screen.getByRole('textbox');
    userEvent.type(textInput, 'a'.repeat(129));

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should fail validation if is not a valid email', () => {
    renderComponent('user@che.org');

    const textInput = screen.getByRole('textbox');
    userEvent.type(textInput, '@test');

    expect(screen.getByTestId('validated')).toHaveTextContent(ValidatedOptions.error);
  });

  it('should handle save', () => {
    renderComponent('user@che.org');

    const textInput = screen.getByRole('textbox');
    userEvent.type(textInput, 'a');

    const buttonSave = screen.getByTestId('button-save');
    userEvent.click(buttonSave);

    expect(mockOnChange).toBeCalledWith('user@che.orga');
  });

  it('should handle cancel', () => {
    renderComponent('user@che.org');

    const textInput = screen.getByRole('textbox');
    userEvent.type(textInput, 'a');

    const buttonCancel = screen.getByTestId('button-cancel');
    userEvent.click(buttonCancel);

    expect(textInput).toHaveValue('user@che.org');
    expect(mockOnChange).not.toBeCalled();
  });
});

function getComponent(value: string): React.ReactElement {
  return <GitConfigUserEmail value={value} onChange={mockOnChange} />;
}
