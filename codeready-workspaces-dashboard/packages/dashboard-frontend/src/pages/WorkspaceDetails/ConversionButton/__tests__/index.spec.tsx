/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { Store } from 'redux';
import { createHashHistory } from 'history';
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import renderer, { ReactTestRendererJSON } from 'react-test-renderer';
import WorkspaceConversionButton from '..';
import { constructWorkspace, Workspace } from '../../../../services/workspace-adapter';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { CheWorkspaceBuilder } from '../../../../store/__mocks__/cheWorkspaceBuilder';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import devfileApi from '../../../../services/devfileApi';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../store/Workspaces', () => {
  return {
    actionCreators: {
      createWorkspaceFromDevfile: () => async (): Promise<void> => Promise.resolve(),
      updateWorkspace: () => async () => Promise.resolve(),
    },
  };
});

jest.mock('../../../../store/Workspaces/devWorkspaces', () => {
  return {
    actionCreators: {
      updateWorkspaceAnnotation: () => async () => Promise.resolve(),
    },
  };
});

const mockCleanupError = jest.fn();
const mockOnError = jest.fn();

describe('WorkspaceConversionButton', () => {
  let cheWorkspace: che.Workspace;
  let devWorkspace: devfileApi.DevWorkspace;
  let store: Store;

  beforeEach(() => {
    cheWorkspace = new CheWorkspaceBuilder()
      .withId('old-workspace-id')
      .withName('workspace-name')
      .withNamespace('user')
      .withDevfile({
        apiVersion: '1.0.0',
        metadata: {
          name: 'workspace-name',
        },
        components: [],
      })
      .build();
    devWorkspace = new DevWorkspaceBuilder()
      .withId('dev-workspace-id')
      .withName('workspace-name')
      .withNamespace('user-dev')
      .build();
    store = new FakeStoreBuilder()
      .withCheWorkspaces({ workspaces: [cheWorkspace] })
      .withDevWorkspaces({ workspaces: [devWorkspace] })
      .withInfrastructureNamespace([
        {
          name: 'user-dev',
          attributes: {
            default: 'true',
            displayName: 'user-dev',
            phase: 'Active',
          },
        },
      ])
      .build();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render', () => {
    const oldWorkspace = constructWorkspace(cheWorkspace);
    const component = getComponent(oldWorkspace);
    const snapshot = createSnapshot(component);
    expect(snapshot).toMatchSnapshot();
  });

  it('should emit cleanupError on conversion start', async () => {
    const oldWorkspace = constructWorkspace(cheWorkspace);
    const component = getComponent(oldWorkspace);
    renderComponent(component);

    const convertButton = screen.getByRole('button', { name: 'Convert' });
    userEvent.click(convertButton);

    await waitFor(() => expect(mockCleanupError).toBeCalled());
  });

  it('should emit onError if devworkspace', async () => {
    // try to convert an devworkspace
    const oldWorkspace = constructWorkspace(devWorkspace);
    const component = getComponent(oldWorkspace);
    renderComponent(component);

    const convertButton = screen.getByRole('button', { name: 'Convert' });
    userEvent.click(convertButton);

    await waitFor(() =>
      expect(mockOnError).toBeCalledWith('This workspace cannot be converted to DevWorkspaces.'),
    );
  });

  it('should emit onError if new workspace is not in the store', async () => {
    // no devworkspace in the store
    store = new FakeStoreBuilder()
      .withCheWorkspaces({ workspaces: [cheWorkspace] })
      .withInfrastructureNamespace([
        {
          name: 'user-dev',
          attributes: {
            default: 'true',
            displayName: 'user-dev',
            phase: 'Active',
          },
        },
      ])
      .build();
    const oldWorkspace = constructWorkspace(cheWorkspace);
    const component = getComponent(oldWorkspace);
    renderComponent(component);

    const convertButton = screen.getByRole('button', { name: 'Convert' });
    userEvent.click(convertButton);

    await waitFor(() =>
      expect(mockOnError).toBeCalledWith(
        'The new DevWorkspace has been created but cannot be obtained.',
      ),
    );
  });

  it('should redirect to new workspace page', async () => {
    const oldWorkspace = constructWorkspace(cheWorkspace);
    const component = getComponent(oldWorkspace);
    renderComponent(component);

    const convertButton = screen.getByRole('button', { name: 'Convert' });
    userEvent.click(convertButton);

    await waitFor(() => expect(window.location.href).toMatch(/user-dev\/workspace-name/));
  });

  function getComponent(oldWorkspace: Workspace): React.ReactElement {
    const history = createHashHistory();
    return (
      <Router history={history}>
        <Provider store={store}>
          <WorkspaceConversionButton
            history={history}
            oldWorkspace={oldWorkspace}
            cleanupError={mockCleanupError}
            onError={mockOnError}
          />
        </Provider>
      </Router>
    );
  }

  function renderComponent(component: React.ReactElement): RenderResult {
    return render(component);
  }

  function createSnapshot(
    component: React.ReactElement,
  ): null | ReactTestRendererJSON | ReactTestRendererJSON[] {
    return renderer.create(component).toJSON();
  }
});
