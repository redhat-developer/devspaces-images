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

import { GitRepoOptions } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/AdditionalGitRemotes');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/GitBranchField');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/PathToDevfileField');

const mockOnChange = jest.fn();

describe('GitRepoOptions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with default values', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with all values', () => {
    const snapshot = createSnapshot(
      'test-git-branch',
      [{ name: 'test', url: 'http://test' }],
      'test-devfile-path',
    );
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should remove "Git Branch" component when it is not supported', () => {
    const { reRenderComponent } = renderComponent(
      'test-git-branch',
      [{ name: 'test', url: 'http://test' }],
      'test-devfile-path',
    );

    expect(screen.queryByTestId('git-branch-component')).not.toBeNull();

    reRenderComponent(undefined, undefined, undefined, false);

    expect(screen.queryByTestId('git-branch-component')).toBeNull();
  });

  test('update Git Branch', () => {
    renderComponent('test-git-branch');

    const gitBranch = screen.getByTestId('git-branch');

    expect(gitBranch).toHaveTextContent('test-git-branch');

    const updateGitBranch = screen.getByRole('button', {
      name: 'Git Branch Change',
    });

    userEvent.click(updateGitBranch);

    expect(mockOnChange).toHaveBeenCalledWith('new-branch', undefined, undefined, true);
  });

  test('update Remotes', () => {
    renderComponent(undefined, [{ name: 'test', url: 'http://test' }]);

    const gitRemotes = screen.getByTestId('git-remotes');

    expect(gitRemotes).toHaveTextContent('[{"name":"test","url":"http://test"}]');

    const updateGitRemotes = screen.getByRole('button', {
      name: 'Git Remotes Change',
    });

    userEvent.click(updateGitRemotes);

    expect(mockOnChange).toHaveBeenCalledWith(
      undefined,
      [{ name: 'test-updated', url: 'http://test' }],
      undefined,
      true,
    );
  });

  test('update PathToDevfile', () => {
    renderComponent(undefined, undefined, 'test-devfile-path');

    const pathToDevfile = screen.getByTestId('devfile-path');

    expect(pathToDevfile).toHaveTextContent('test-devfile-path');

    const updatePathToDevfile = screen.getByRole('button', {
      name: 'Devfile Path Change',
    });

    userEvent.click(updatePathToDevfile);

    expect(mockOnChange).toHaveBeenCalledWith(undefined, undefined, 'new-devfile-path', true);
  });
});

function getComponent(
  gitBranch?: string | undefined,
  remotes?: GitRemote[] | undefined,
  devfilePath?: string | undefined,
  hasSupportedGitService: boolean = true,
) {
  return (
    <GitRepoOptions
      gitBranch={gitBranch}
      remotes={remotes}
      devfilePath={devfilePath}
      hasSupportedGitService={hasSupportedGitService}
      onChange={mockOnChange}
    />
  );
}
