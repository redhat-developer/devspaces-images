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

import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { MIN_STEP_DURATION_MS } from '@/components/WorkspaceProgress/const';
import getComponentRenderer, { waitFor } from '@/services/__mocks__/getComponentRenderer';
import {
  DEV_WORKSPACE_ATTR,
  ERROR_CODE_ATTR,
  FACTORY_URL_ATTR,
  POLICIES_CREATE_ATTR,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem, UserPreferencesTab } from '@/services/helpers/types';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import CreatingStepInitialize from '..';

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

jest.mock('@/services/helpers/location', () => ({
  toHref: (_: unknown, location: string) => 'http://localhost/' + location,
  buildUserPreferencesLocation: (tab: UserPreferencesTab) => 'user-preferences?tab=' + tab,
}));

describe('Creating steps, initializing', () => {
  const factoryUrl = 'https://factory-url';
  const { reload } = window.location;

  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .withSshKeys({
        keys: [{ name: 'key1', keyPub: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD' }],
      })
      .build();

    delete (window as any).location;
    (window.location as any) = { reload: jest.fn() };
    window.open = jest.fn();

    jest.useFakeTimers();
  });

  afterEach(() => {
    window.location.reload = reload;

    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('factory URL is omitted', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: '',
    });

    // this will help test the case when the user clicks on the "Click to try again" button
    mockOnError.mockImplementation((alertItem: AlertItem) => {
      if (alertItem.actionCallbacks) {
        alertItem.actionCallbacks[0].callback();
      }
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining('Repository/Devfile URL is missing'),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(window.location.reload).toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('devworkspace resources URL is omitted', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [DEV_WORKSPACE_ATTR]: '',
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining('DevWorkspace resources URL is missing.'),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('`invalid_request` error code', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [ERROR_CODE_ATTR]: 'invalid_request',
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining(
        'Could not resolve devfile from private repository because authentication request is missing a parameter, contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
      ),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('`policies.create` valid', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [POLICIES_CREATE_ATTR]: 'peruser',
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
  });

  test('`policies.create` invalid', async () => {
    const wrongPolicy = 'wrong-policy';
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [POLICIES_CREATE_ATTR]: wrongPolicy,
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining(
        'Unsupported create policy "wrong-policy" is specified while the only following are supported: peruser, perclick',
      ),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('no pre-created infrastructure namespaces', async () => {
    const storeNoNamespace = new FakeStoreBuilder().build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    renderComponent(storeNoNamespace, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining(
        'Failed to create a workspace. The infrastructure namespace is required to be created. Please, contact the cluster administrator.',
      ),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('all workspaces limit exceeded', async () => {
    const store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .withClusterConfig({ allWorkspacesLimit: 1 })
      .withDevWorkspaces({ workspaces: [new DevWorkspaceBuilder().build()] })
      .withSshKeys({
        keys: [{ name: 'key1', keyPub: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD' }],
      })
      .build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: expect.stringContaining('You can only keep 1 workspace.'),
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('no SSH keys with Git+HTTPS factory URL', async () => {
    const store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnError).not.toHaveBeenCalled());

    expect(mockOnNextStep).toHaveBeenCalled();
  });

  test('no SSH keys with Git+SSH factory URL', async () => {
    const factoryUrl = 'git@github.com:eclipse-che/che-dashboard.git';
    const store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    // this will help test the case when the user clicks on the "Add SSH Keys" button
    mockOnError.mockImplementation((alertItem: AlertItem) => {
      if (alertItem.actionCallbacks) {
        alertItem.actionCallbacks[1].callback();
      }
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'No SSH keys found',
      children: 'No SSH keys found. Please add your SSH keys and then try again.',
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Add SSH Keys',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(window.open).toHaveBeenCalledWith(
      'http://localhost/user-preferences?tab=SshKeys',
      '_blank',
    );
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });
});

function getComponent(store: Store, searchParams: URLSearchParams): React.ReactElement {
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <CreatingStepInitialize
        distance={0}
        hasChildren={false}
        history={history}
        searchParams={searchParams}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
        onError={mockOnError}
        onHideError={mockOnHideError}
      />
    </Provider>
  );
}
