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

import { render, screen, waitFor } from '@testing-library/react';
import { createHashHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { BrandingData } from '@/services/bootstrap/branding.constant';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { devfileToDevWorkspace } from '@/services/workspace-client/devworkspace/converters';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import GetStarted from '..';

const setWorkspaceQualifiedName = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);

const namespace = 'che';
const workspaceName = 'wksp-test';
const dummyDevfile = {
  schemaVersion: '2.2.0',
  metadata: {
    name: workspaceName,
    namespace,
  },
} as devfileApi.Devfile;
const workspace = new DevWorkspaceBuilder()
  .withName(workspaceName)
  .withNamespace(namespace)
  .build();

jest.mock('../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      createWorkspaceFromDevfile: (devfile, attributes) => async (): Promise<Workspace> => {
        createWorkspaceFromDevfileMock(devfile, attributes);
        const devWorkspace = devfileToDevWorkspace(devfile, 'che', false);
        return constructWorkspace(devWorkspace);
      },
      startWorkspace: workspace => async (): Promise<void> => {
        startWorkspaceMock(workspace);
      },
      setWorkspaceQualifiedName:
        (namespace: string, workspaceName: string) => async (): Promise<void> => {
          setWorkspaceQualifiedName(namespace, workspaceName);
        },
    },
  };
});

jest.mock('../GetStartedTab', () => {
  return function DummyTab(props: {
    onDevfile: (devfileContent: string, stackName: string) => Promise<void>;
  }): React.ReactElement {
    return (
      <span>
        Samples List Tab Content
        <button
          onClick={() => {
            props.onDevfile(JSON.stringify(dummyDevfile), 'dummyStackName');
          }}
        >
          Dummy Devfile
        </button>
      </span>
    );
  };
});

describe('Quick Add page', () => {
  it('should create and start a new workspace', async () => {
    renderGetStartedPage();

    const quickAddTabButton = screen.getByRole('tab', { name: 'Quick Add' });
    quickAddTabButton.click();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Dummy Devfile' })).toBeTruthy());

    const devfileButton = await screen.findByRole('button', { name: 'Dummy Devfile' });
    expect(devfileButton).toBeTruthy();
    devfileButton.click();

    expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(dummyDevfile, {
      factoryId: 'dummyStackName',
    });
  });

  it('should have correct masthead when Quick Add tab is active', () => {
    renderGetStartedPage();
    const masthead = screen.getByRole('heading');

    const quickAddTabButton = screen.getByRole('tab', { name: 'Quick Add' });
    quickAddTabButton.click();

    expect(masthead.textContent?.startsWith('Getting Started with'));
  });
});

function renderGetStartedPage(): void {
  const store = createFakeStore();
  const history = createHashHistory();
  render(
    <Provider store={store}>
      <GetStarted history={history} />
    </Provider>,
  );
}

function createFakeStore(): Store {
  return new FakeStoreBuilder()
    .withBranding({
      name: 'test',
    } as BrandingData)
    .withDevWorkspaces({
      workspaces: [workspace],
    })
    .withWorkspaces({
      namespace: workspace.metadata.namespace,
      workspaceName: workspace.metadata.name,
    })
    .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
    .build();
}
