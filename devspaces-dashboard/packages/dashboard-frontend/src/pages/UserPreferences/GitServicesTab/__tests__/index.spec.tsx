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

import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { Store } from 'redux';
import { GitServicesTab } from '..';
import { FakeGitOauthBuilder } from './__mocks__/gitOauthRowBuilder';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { selectIsLoading, selectGitOauth } from '../../../../store/GitOauthConfig/selectors';
import { actionCreators } from '../../../../store/GitOauthConfig';

// mute the outputs
console.error = jest.fn();
jest.mock('../ProviderWarning', () => {
  return function ProviderWarning(props: { warning: React.ReactNode }): React.ReactElement {
    return <span>{props.warning}</span>;
  };
});

describe('GitServices', () => {
  const mockRevokeOauth = jest.fn();
  const requestGitOauthConfig = jest.fn();

  const getComponent = (store: Store): React.ReactElement => {
    const state = store.getState();
    const gitOauth = selectGitOauth(state);
    const isLoading = selectIsLoading(state);
    return (
      <Provider store={store}>
        <GitServicesTab
          gitOauth={gitOauth}
          isLoading={isLoading}
          revokeOauth={mockRevokeOauth}
          requestGitOauthConfig={requestGitOauthConfig}
        />
      </Provider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component without git services', () => {
    const component = getComponent(new FakeStoreBuilder().build());
    render(component);

    const emptyStateText = screen.queryByText('No Git Services');
    expect(emptyStateText).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should correctly render the component which contains four git services', () => {
    const component = getComponent(
      new FakeStoreBuilder()
        .withGitOauthConfig([
          new FakeGitOauthBuilder()
            .withName('github')
            .withEndpointUrl('https://github.dummy.endpoint.com')
            .build(),
          new FakeGitOauthBuilder()
            .withName('gitlab')
            .withEndpointUrl('https://gitlab.dummy.endpoint.com')
            .build(),
          new FakeGitOauthBuilder()
            .withName('bitbucket')
            .withEndpointUrl('https://bitbucket.dummy.endpoint.org')
            .build(),
          new FakeGitOauthBuilder()
            .withName('azure-devops')
            .withEndpointUrl('https://azure.dummy.endpoint.com/')
            .build(),
        ])
        .build(),
    );
    render(component);

    const emptyStateText = screen.queryByText('No Git Services');
    expect(emptyStateText).not.toBeTruthy();

    const actions = screen.queryAllByRole('button', { name: /actions/i });

    expect(actions.length).toEqual(4);
    expect(actions[0]).not.toBeDisabled();
    expect(actions[1]).toBeDisabled();
    expect(actions[2]).toBeDisabled();
    expect(actions[3]).toBeDisabled();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should revoke a git service', () => {
    const spyRevokeOauth = jest.spyOn(actionCreators, 'revokeOauth');
    const component = getComponent(
      new FakeStoreBuilder()
        .withGitOauthConfig([
          new FakeGitOauthBuilder()
            .withName('github')
            .withEndpointUrl('https://github.com')
            .build(),
        ])
        .build(),
    );
    render(component);

    const menuButton = screen.getByLabelText('Actions');
    userEvent.click(menuButton);

    const revokeItem = screen.getByRole('menuitem', { name: /Revoke/i });
    userEvent.click(revokeItem);

    const text = screen.findByText("Would you like to revoke git service 'GitHub'?");
    expect(text).toBeTruthy();

    const revokeButton = screen.getByTestId('revoke-button');
    expect(revokeButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);
    expect(revokeButton).toBeEnabled();

    userEvent.click(revokeButton);
    expect(spyRevokeOauth).toBeCalledWith('github');
  });
});
