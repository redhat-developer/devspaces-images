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

import { GitBranchField } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/GitBranchField';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitBranchField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('git branch preset value', () => {
    renderComponent('preset-git-branch');

    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('preset-git-branch');
  });

  test('git branch change', () => {
    renderComponent();

    const input = screen.getByRole('textbox');

    const gitBranch = 'new-git-branch';
    userEvent.paste(input, gitBranch);

    expect(mockOnChange).toHaveBeenNthCalledWith(1, gitBranch);

    userEvent.clear(input);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, '');
  });
});

function getComponent(gitBranch?: string) {
  return <GitBranchField gitBranch={gitBranch} onChange={mockOnChange} />;
}
