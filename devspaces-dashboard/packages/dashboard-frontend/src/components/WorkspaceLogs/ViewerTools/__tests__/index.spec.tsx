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

import { ToggleBarsContext } from '@/contexts/ToggleBars';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { WorkspaceLogsViewerTools } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnDownload = jest.fn();
const mockOnToggle = jest.fn();

const mockHideAll = jest.fn();
const mockShowAll = jest.fn();

describe('The WorkspaceLogsTerminalTools component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    expect(createSnapshot()).toMatchSnapshot();
  });

  it('should handle download button click', async () => {
    renderComponent();

    const downloadButton = screen.getByRole('button', { name: 'Download' });
    await userEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalled();
  });

  it('should handle expand button click', async () => {
    renderComponent();

    const expandButton = screen.getByRole('button', { name: 'Expand' });
    await userEvent.click(expandButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockHideAll).toHaveBeenCalled();

    const compressButton = screen.queryByRole('button', { name: 'Compress' });
    expect(compressButton).not.toBeNull();

    await userEvent.click(compressButton!);

    expect(mockShowAll).toHaveBeenCalled();
    expect(mockOnToggle).toHaveBeenCalledTimes(2);
  });
});

function getComponent(): React.ReactElement {
  return (
    <ToggleBarsContext.Provider
      value={{
        hideAll: () => mockHideAll(),
        showAll: () => mockShowAll(),
      }}
    >
      <WorkspaceLogsViewerTools onDownload={mockOnDownload} onToggle={mockOnToggle} />
    </ToggleBarsContext.Provider>
  );
}
