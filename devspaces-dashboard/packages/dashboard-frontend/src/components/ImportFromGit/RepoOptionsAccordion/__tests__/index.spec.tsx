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
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import RepoOptionsAccordion from '@/components/ImportFromGit/RepoOptionsAccordion';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const history = createMemoryHistory({
  initialEntries: ['/'],
});

jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions');
jest.mock('@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions');

const mockOnChange = jest.fn();

describe('RepoOptionsAccordion', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withSshKeys({
        keys: [{ name: 'key1', keyPub: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD' }],
      })
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with default values', () => {
    const snapshot = createSnapshot(store, 'testlocation');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('update Advanced Options', () => {
    renderComponent(store, 'https://testlocation');

    let updateAdvancedOptions = screen.queryByRole('button', {
      name: 'Advanced Options Change',
    });

    expect(updateAdvancedOptions).toBeNull();

    const accordionItemAdvancedOptions = screen.getByTestId('accordion-item-advanced-options');

    userEvent.click(accordionItemAdvancedOptions);

    const advancedOptions = screen.queryByTestId('advanced-options');

    expect(advancedOptions).not.toBeNull();
    expect(advancedOptions).toHaveTextContent(
      'undefined, undefined, undefined, undefined, undefined',
    );

    updateAdvancedOptions = screen.queryByRole('button', {
      name: 'Advanced Options Change',
    });

    expect(updateAdvancedOptions).not.toBeNull();

    userEvent.click(updateAdvancedOptions as HTMLElement);

    expect(mockOnChange).toHaveBeenCalledWith(
      'https://testlocation?image=newContainerImage&storageType=ephemeral&policies.create=perclick&memoryLimit=1Gi&cpuLimit=1',
      undefined,
    );
  });

  test('update Git Repo Options without a supported git service', () => {
    renderComponent(store, 'https://testlocation');

    let updateGitRepoOptions = screen.queryByRole('button', {
      name: 'Git Repo Options Change',
    });

    expect(updateGitRepoOptions).toBeNull();

    const accordionItemGitRepoOptions = screen.getByTestId('accordion-item-git-repo-options');

    userEvent.click(accordionItemGitRepoOptions);

    const gitRepoOptions = screen.queryByTestId('git-repo-options');

    expect(gitRepoOptions).not.toBeNull();
    expect(gitRepoOptions).toHaveTextContent('undefined, [], undefined, false');

    updateGitRepoOptions = screen.queryByRole('button', {
      name: 'Git Repo Options Change',
    });

    expect(updateGitRepoOptions).not.toBeNull();

    userEvent.click(updateGitRepoOptions as HTMLElement);

    expect(mockOnChange).toHaveBeenCalledWith(
      'https://testlocation?remotes={{test-updated,http://test}}&devfilePath=newDevfilePath',
      'success',
    );
  });

  test('update Git Repo Options wit a supported git service', () => {
    renderComponent(store, 'https://github.com/testlocation');

    let updateGitRepoOptions = screen.queryByRole('button', {
      name: 'Git Repo Options Change',
    });

    expect(updateGitRepoOptions).toBeNull();

    const accordionItemGitRepoOptions = screen.getByTestId('accordion-item-git-repo-options');

    userEvent.click(accordionItemGitRepoOptions);

    const gitRepoOptions = screen.queryByTestId('git-repo-options');

    expect(gitRepoOptions).not.toBeNull();
    expect(gitRepoOptions).toHaveTextContent('undefined, [], undefined, true');

    updateGitRepoOptions = screen.queryByRole('button', {
      name: 'Git Repo Options Change',
    });

    expect(updateGitRepoOptions).not.toBeNull();

    userEvent.click(updateGitRepoOptions as HTMLElement);

    expect(mockOnChange).toHaveBeenCalledWith(
      'https://github.com/testlocation/undefined/tree/newBranch?remotes={{test-updated,http://test}}&devfilePath=newDevfilePath',
      'success',
    );
  });
});

function getComponent(store: Store, location: string) {
  return (
    <Provider store={store}>
      <RepoOptionsAccordion history={history} location={location} onChange={mockOnChange} />
    </Provider>
  );
}
