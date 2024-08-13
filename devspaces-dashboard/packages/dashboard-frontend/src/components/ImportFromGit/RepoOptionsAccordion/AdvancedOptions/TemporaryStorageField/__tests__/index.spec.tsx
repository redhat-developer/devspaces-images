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

import React from 'react';

import { TemporaryStorageField } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/TemporaryStorageField';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('TemporaryStorageField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('switched off snapshot', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('switched on snapshot', () => {
    const snapshot = createSnapshot(true);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should be initially switched off', () => {
    renderComponent(undefined);
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();
  });

  it('should be switched off', () => {
    renderComponent(false);
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    switchInput.click();
    expect(switchInput.checked).toBeTruthy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should be initially switched on', () => {
    renderComponent(true);
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeTruthy();

    switchInput.click();
    expect(switchInput.checked).toBeFalsy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});

function getComponent(isTemporary: boolean | undefined) {
  return <TemporaryStorageField isTemporary={isTemporary} onChange={mockOnChange} />;
}
