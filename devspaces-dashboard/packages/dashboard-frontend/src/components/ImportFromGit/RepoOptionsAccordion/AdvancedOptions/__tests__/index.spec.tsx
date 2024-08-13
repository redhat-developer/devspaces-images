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

import userEvent from '@testing-library/user-event';
import React from 'react';

import { AdvancedOptions } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/ContainerImageField');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/CpuLimitField');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/MemoryLimitField');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/TemporaryStorageField');
jest.mock(
  '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/CreateNewIfExistingField',
);

const mockOnChange = jest.fn();

describe('AdvancedOptions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with default values', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with all values', () => {
    const snapshot = createSnapshot('testimage', true, true, 4718592, 2);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('update Container Image', () => {
    renderComponent('testimage');

    const containerImage = screen.getByTestId('container-image');

    expect(containerImage).toHaveTextContent('testimage');

    const updateContainerImage = screen.getByRole('button', {
      name: 'Container Image Change',
    });

    userEvent.click(updateContainerImage);

    expect(mockOnChange).toHaveBeenCalledWith(
      'new-container-image',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  test('update Cpu Limit', () => {
    renderComponent(undefined, undefined, undefined, undefined, 8);

    const cpuLimit = screen.getByTestId('cpu-limit');

    expect(cpuLimit).toHaveTextContent('8');

    const updateCpuLimit = screen.getByRole('button', {
      name: 'Cpu Limit Change',
    });

    userEvent.click(updateCpuLimit);

    expect(mockOnChange).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, 1);
  });

  test('update CreateNewIfExisting', () => {
    renderComponent(undefined, undefined, true);

    const createNewIfExisting = screen.getByTestId('create-new-if-existing');

    expect(createNewIfExisting).toHaveTextContent('true');

    const updateCreateNewIfExisting = screen.getByRole('button', {
      name: 'Create New If Existing Change',
    });

    userEvent.click(updateCreateNewIfExisting);

    expect(mockOnChange).toHaveBeenCalledWith(undefined, undefined, false, undefined, undefined);
  });

  test('update Memory Limit', () => {
    renderComponent(undefined, undefined, undefined, 4718592);

    const memoryLimit = screen.getByTestId('memory-limit');

    expect(memoryLimit).toHaveTextContent('4718592');

    const updateMemoryLimit = screen.getByRole('button', {
      name: 'Memory Limit Change',
    });

    userEvent.click(updateMemoryLimit);

    expect(mockOnChange).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      1073741824,
      undefined,
    );
  });

  test('update Temporary Storage', () => {
    renderComponent(undefined, true);

    const temporaryStorage = screen.getByTestId('temporary-storage');

    expect(temporaryStorage).toHaveTextContent('true');

    const updateTemporaryStorage = screen.getByRole('button', {
      name: 'Temporary Storage Change',
    });

    userEvent.click(updateTemporaryStorage);

    expect(mockOnChange).toHaveBeenCalledWith(undefined, false, undefined, undefined, undefined);
  });
});

function getComponent(
  containerImage?: string | undefined,
  temporaryStorage?: boolean | undefined,
  createNewIfExisting?: boolean | undefined,
  memoryLimit?: number | undefined,
  cpuLimit?: number | undefined,
) {
  return (
    <AdvancedOptions
      containerImage={containerImage}
      temporaryStorage={temporaryStorage}
      createNewIfExisting={createNewIfExisting}
      memoryLimit={memoryLimit}
      cpuLimit={cpuLimit}
      onChange={mockOnChange}
    />
  );
}
