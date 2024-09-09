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

import { GitServicesList, Props } from '@/pages/UserPreferences/GitServices/List';
import getComponentRenderer, { screen, within } from '@/services/__mocks__/getComponentRenderer';

jest.mock('@/pages/UserPreferences/GitServices/List/StatusIcon');
jest.mock('@/pages/UserPreferences/GitServices/List/Tooltip');
jest.mock('@/pages/UserPreferences/GitServices/Toolbar');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('GitServicesList', () => {
  let props: Props;

  beforeEach(() => {
    props = {
      gitOauth: [
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
        {
          name: 'gitlab',
          endpointUrl: 'https://gitlab.com',
        },
        {
          name: 'bitbucket',
          endpointUrl: 'https://bitbucket.com',
        },
      ],
      isDisabled: false,
      onRevokeServices: jest.fn(),
      onClearService: jest.fn(),
      providersWithToken: ['github', 'gitlab'],
      skipOauthProviders: [],
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(props);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('initial state', () => {
    renderComponent(props);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);

    // The very first row in the table is the header, skip it

    // The next row is Bitbucket
    {
      const bitbucketRow = rows[1];
      expect(bitbucketRow).toHaveTextContent('bitbucket');
      expect(bitbucketRow).toHaveTextContent('https://bitbucket.com');

      const checkbox = within(bitbucketRow).getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toBeChecked();

      const kebab = within(bitbucketRow).getByRole('button', { name: 'Actions' });
      expect(kebab).toBeDisabled();
    }

    // The next row is Github
    {
      const githubRow = rows[2];
      expect(githubRow).toHaveTextContent('github');
      expect(githubRow).toHaveTextContent('https://github.com');

      const checkbox = within(githubRow).getByRole('checkbox');
      expect(checkbox).toBeEnabled();
      expect(checkbox).not.toBeChecked();

      const kebab = within(githubRow).getByRole('button', { name: 'Actions' });
      expect(kebab).toBeEnabled();
    }

    // The next row is Gitlab
    {
      const gitlabRow = rows[3];
      expect(gitlabRow).toHaveTextContent('gitlab');
      expect(gitlabRow).toHaveTextContent('https://gitlab.com');

      const checkbox = within(gitlabRow).getByRole('checkbox');
      expect(checkbox).toBeEnabled();
      expect(checkbox).not.toBeChecked();

      const kebab = within(gitlabRow).getByRole('button', { name: 'Actions' });
      expect(kebab).toBeEnabled();
    }
  });

  test('service revocable (gitlab)', () => {
    renderComponent(props);

    const rows = screen.getAllByRole('row');

    // get the github row
    const gitlabRow = rows[3];
    expect(gitlabRow).toHaveTextContent('gitlab');

    const gitlabCheckbox = within(gitlabRow).getByRole('checkbox');
    const gitlabKebab = within(gitlabRow).getByRole('button', { name: 'Actions' });

    expect(gitlabCheckbox).toBeEnabled();
    expect(gitlabCheckbox).not.toBeChecked();

    expect(gitlabKebab).toBeEnabled();
  });

  test('service revocable (github)', async () => {
    renderComponent(props);

    const rows = screen.getAllByRole('row');

    // get the github row
    const githubRow = rows[2];
    expect(githubRow).toHaveTextContent('github');

    const githubCheckbox = within(githubRow).getByRole('checkbox');
    const githubKebab = within(githubRow).getByRole('button', { name: 'Actions' });

    // the checkbox is enabled and unchecked
    expect(githubCheckbox).toBeEnabled();
    expect(githubCheckbox).not.toBeChecked();

    // check the checkbox
    await userEvent.click(githubCheckbox);
    expect(githubCheckbox).toBeChecked();

    // uncheck the checkbox
    await userEvent.click(githubCheckbox);
    expect(githubCheckbox).not.toBeChecked();

    // the kebab button is enabled
    expect(githubKebab).toBeEnabled();

    // revoke button is not present
    {
      const revokeButton = within(githubRow).queryByRole('menuitem', { name: 'Revoke' });
      expect(revokeButton).toBeNull();
    }

    // open kebab menu
    await userEvent.click(githubKebab);

    // the revoke button is present
    const revokeButton = within(githubRow).queryByRole('menuitem', { name: 'Revoke' });
    expect(revokeButton).not.toBeNull();

    // click the revoke button
    await userEvent.click(revokeButton!);

    expect(props.onRevokeServices).toHaveBeenCalledTimes(1);
    expect(props.onRevokeServices).toHaveBeenCalledWith([
      {
        name: 'github',
        endpointUrl: 'https://github.com',
      },
    ]);
  });

  test('can clear opt-out (github)', async () => {
    props = {
      gitOauth: [
        {
          name: 'github',
          endpointUrl: 'https://github.com',
        },
      ],
      isDisabled: false,
      onRevokeServices: jest.fn(),
      onClearService: jest.fn(),
      providersWithToken: [],
      skipOauthProviders: ['github'],
    };
    renderComponent(props);

    const rows = screen.getAllByRole('row');

    // get the github row
    const githubRow = rows[1];
    expect(githubRow).toHaveTextContent('github');

    const githubCheckbox = within(githubRow).getByRole('checkbox');
    const githubKebab = within(githubRow).getByRole('button', { name: 'Actions' });

    // the checkbox is disabled and unchecked
    expect(githubCheckbox).toBeDisabled();
    expect(githubCheckbox).not.toBeChecked();

    // the kebab button is enabled
    expect(githubKebab).toBeEnabled();

    // Clear button is not present
    {
      const clearButton = within(githubRow).queryByRole('menuitem', { name: 'Clear' });
      expect(clearButton).toBeNull();
    }

    // open kebab menu
    await userEvent.click(githubKebab);

    // the Clear button is present
    const clearButton = within(githubRow).queryByRole('menuitem', { name: 'Clear' });
    expect(clearButton).not.toBeNull();

    // click the Clear button
    await userEvent.click(clearButton!);

    expect(props.onClearService).toHaveBeenCalledTimes(1);
    expect(props.onClearService).toHaveBeenCalledWith('github');
  });

  test('toolbar', async () => {
    renderComponent(props);

    const selectedItemsCount = screen.getByTestId('selected-items-count');

    // No items selected
    expect(selectedItemsCount).toHaveTextContent('0');

    const rows = screen.getAllByRole('row');

    // check the github row
    const githubRow = rows[2];
    const githubCheckbox = within(githubRow).getByRole('checkbox');
    await userEvent.click(githubCheckbox);

    // One item selected
    expect(selectedItemsCount).toHaveTextContent('1');

    // the revoke button in toolbar
    const revokeButton = screen.getByRole('button', { name: 'Revoke' });
    await userEvent.click(revokeButton);

    expect(props.onRevokeServices).toHaveBeenCalledTimes(1);
    expect(props.onRevokeServices).toHaveBeenCalledWith([
      {
        name: 'github',
        endpointUrl: 'https://github.com',
      },
    ]);
  });

  test('disabled list', () => {
    // initially prop isDisabled is false
    const { reRenderComponent } = renderComponent(props);

    const rows = screen.getAllByRole('row');

    // get the github row
    const githubRow = rows[2];
    expect(githubRow).toHaveTextContent('github');

    // get the github row controls
    const githubCheckbox = within(githubRow).getByRole('checkbox');
    const githubKebab = within(githubRow).getByRole('button', { name: 'Actions' });

    // they are enabled
    expect(githubCheckbox).toBeEnabled();
    expect(githubKebab).toBeEnabled();

    // toolbar is enabled
    const revokeButtonDisabled = screen.getByTestId('revoke-is-disabled');
    expect(revokeButtonDisabled).toHaveTextContent('false');

    // set isDisabled to be true
    reRenderComponent({ ...props, isDisabled: true });

    // the github row controls are disabled
    expect(githubCheckbox).toBeDisabled();

    // toolbar is disabled
    expect(revokeButtonDisabled).toHaveTextContent('true');
  });
});

function getComponent(props: Props): React.ReactElement<Props> {
  return (
    <GitServicesList
      gitOauth={props.gitOauth}
      isDisabled={props.isDisabled}
      onRevokeServices={props.onRevokeServices}
      onClearService={props.onClearService}
      providersWithToken={props.providersWithToken}
      skipOauthProviders={props.skipOauthProviders}
    />
  );
}
