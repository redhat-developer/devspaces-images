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

import { createHashHistory } from 'history';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { Store } from 'redux';
import React from 'react';
import GetStarted from '..';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { constructWorkspace, Devfile, Workspace } from '../../../services/workspace-adapter';
import { CheWorkspaceBuilder } from '../../../store/__mocks__/cheWorkspaceBuilder';

const setWorkspaceQualifiedName = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);

const namespace = 'che';
const workspaceName = 'wksp-test';
const dummyDevfile = {
  apiVersion: '1.0.0',
  metadata: {
    name: workspaceName,
  },
} as Devfile;
const workspace = new CheWorkspaceBuilder()
  .withDevfile(dummyDevfile as che.WorkspaceDevfile)
  .withNamespace(namespace)
  .build();

jest.mock('../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      createWorkspaceFromDevfile:
        (devfile, namespace, infrastructureNamespace, attributes) =>
        async (): Promise<Workspace> => {
          createWorkspaceFromDevfileMock(devfile, namespace, infrastructureNamespace, attributes);
          return constructWorkspace({
            id: 'id-wksp-test',
            attributes,
            namespace,
            devfile: dummyDevfile as che.WorkspaceDevfile,
            temporary: false,
            status: 'STOPPED',
          });
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

    const quickAddTabButton = screen.getByRole('button', { name: 'Quick Add' });
    quickAddTabButton.click();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Dummy Devfile' })).toBeTruthy());

    const devfileButton = screen.getByRole('button', { name: 'Dummy Devfile' });
    devfileButton.click();

    expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
      dummyDevfile,
      undefined,
      namespace,
      { stackName: 'dummyStackName' },
    );
  });

  it('should have correct masthead when Quick Add tab is active', () => {
    renderGetStartedPage();
    const masthead = screen.getByRole('heading');

    const quickAddTabButton = screen.getByRole('button', { name: 'Quick Add' });
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
    .withCheWorkspaces({
      workspaces: [workspace],
    })
    .withWorkspaces({
      workspaceUID: workspace.id,
      namespace: namespace,
      workspaceName: workspace.devfile.metadata.name,
    })
    .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
    .build();
}
