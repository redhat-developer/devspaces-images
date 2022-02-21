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
import { RouteComponentProps } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import WorkspaceDetailsContainer from '..';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { ROUTE } from '../../../route.enum';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import {
  ActionCreators,
  actionCreators as workspacesActionCreators,
} from '../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { CheWorkspaceBuilder } from '../../../store/__mocks__/cheWorkspaceBuilder';
import {
  DEVWORKSPACE_ID_OVERRIDE_ANNOTATION,
  ORIGINAL_WORKSPACE_ID_ANNOTATION,
} from '../../../services/devfileApi/devWorkspace/metadata';
import userEvent from '@testing-library/user-event';
import devfileApi from '../../../services/devfileApi';
import { DEVWORKSPACE_METADATA_ANNOTATION } from '../../../services/workspace-client/devworkspace/devWorkspaceClient';

const mockUpdateWorkspace = jest.fn();
const mockCreateWorkspaceFromDevfile = jest.fn();

jest.mock('../../../store/Workspaces');
(workspacesActionCreators.requestWorkspaces as jest.Mock).mockImplementation(() => async () => {
  // no-op
});
(workspacesActionCreators.createWorkspaceFromDevfile as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockCreateWorkspaceFromDevfile(...args),
);
(workspacesActionCreators.updateWorkspace as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockUpdateWorkspace(...args),
);

jest.mock('../../../pages/WorkspaceDetails');

describe('Workspace Details container', () => {
  // beforeEach(() => {});
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('devfile v1->v2 conversion', () => {
    const workspaceName = 'wksp';
    const cheWorkspaceId = 'che-wksp-id';
    const devWorkspaceId = 'dev-wksp-id';
    const cheNamespace = 'user-che';
    const devNamespace = 'user-dev';

    type Props = {
      namespace: string;
      workspaceName: string;
    };

    let cheWorkspaceBuilder: CheWorkspaceBuilder;
    let devWorkspaceBuilder: DevWorkspaceBuilder;
    let fakeStoreBuilder: FakeStoreBuilder;

    beforeEach(() => {
      cheWorkspaceBuilder = new CheWorkspaceBuilder()
        .withId(cheWorkspaceId)
        .withName(workspaceName)
        .withNamespace(cheNamespace);
      devWorkspaceBuilder = new DevWorkspaceBuilder()
        .withId(devWorkspaceId)
        .withName(workspaceName)
        .withNamespace(devNamespace);
      fakeStoreBuilder = new FakeStoreBuilder()
        .withWorkspacesSettings({ 'che.devworkspaces.enabled': 'true' } as che.WorkspaceSettings)
        .withInfrastructureNamespace(
          [{ name: devNamespace, attributes: { phase: 'Active' } }],
          false,
        );
    });

    describe('DevWorkspace', () => {
      let routeProps: RouteComponentProps<Props>;

      beforeEach(() => {
        routeProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
          namespace: devNamespace,
          workspaceName,
        });
      });

      it('should not show the Convert button', () => {
        const devWorkspace = devWorkspaceBuilder.build();
        const store = fakeStoreBuilder.withDevWorkspaces({ workspaces: [devWorkspace] }).build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const showConvertButton = screen.getByTestId('props-show-convert-button');
        expect(showConvertButton).toHaveTextContent('false');
      });

      it('should not show an old workspace link - without annotation', () => {
        const cheWorkspace = cheWorkspaceBuilder
          .withAttributes({
            convertedId: devWorkspaceId,
          } as che.WorkspaceAttributes)
          .build();
        const devWorkspace = devWorkspaceBuilder.build();
        const store = fakeStoreBuilder
          .withCheWorkspaces({ workspaces: [cheWorkspace] })
          .withDevWorkspaces({ workspaces: [devWorkspace] })
          .build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const oldWorkspacePath = screen.getByTestId('props-old-workspace-path');
        expect(oldWorkspacePath).toHaveTextContent('');
      });

      it('should not show any old workspace link - with annotation', () => {
        const devWorkspace = devWorkspaceBuilder
          .withMetadata({
            annotations: {
              [ORIGINAL_WORKSPACE_ID_ANNOTATION]: cheWorkspaceId,
            },
          })
          .build();
        const store = fakeStoreBuilder.withDevWorkspaces({ workspaces: [devWorkspace] }).build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const oldWorkspacePath = screen.getByTestId('props-old-workspace-path');
        expect(oldWorkspacePath).toHaveTextContent('');
      });

      it('should show the old workspace link', async () => {
        const cheWorkspace = cheWorkspaceBuilder
          .withAttributes({
            convertedId: devWorkspaceId,
          } as che.WorkspaceAttributes)
          .build();
        const devWorkspace = devWorkspaceBuilder
          .withMetadata({
            annotations: {
              [ORIGINAL_WORKSPACE_ID_ANNOTATION]: cheWorkspaceId,
            },
          })
          .build();
        const store = fakeStoreBuilder
          .withCheWorkspaces({ workspaces: [cheWorkspace] })
          .withDevWorkspaces({ workspaces: [devWorkspace] })
          .build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const oldWorkspacePath = screen.getByTestId('props-old-workspace-path');
        const expectedPath = `workspace/${cheNamespace}/${workspaceName}`;
        expect(oldWorkspacePath).toHaveTextContent(expectedPath);
      });
    });

    describe('Che workspace', () => {
      let routeProps: RouteComponentProps<Props>;

      beforeEach(() => {
        routeProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
          namespace: cheNamespace,
          workspaceName,
        });
      });

      it('should not show the old workspace link', () => {
        const cheWorkspace = cheWorkspaceBuilder.build();
        const store = fakeStoreBuilder.withCheWorkspaces({ workspaces: [cheWorkspace] }).build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const oldWorkspacePath = screen.getByTestId('props-old-workspace-path');
        expect(oldWorkspacePath).toHaveTextContent('');
      });

      it('should not show the Convert button - if the converted workspace exists', () => {
        const cheWorkspace = cheWorkspaceBuilder
          .withAttributes({
            convertedId: devWorkspaceId,
          } as che.WorkspaceAttributes)
          .build();
        const devWorkspace = devWorkspaceBuilder.build();
        const store = fakeStoreBuilder
          .withCheWorkspaces({ workspaces: [cheWorkspace] })
          .withDevWorkspaces({ workspaces: [devWorkspace] })
          .build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const showConvertButton = screen.queryByTestId('props-show-convert-button');
        expect(showConvertButton).toHaveTextContent('false');
      });

      it('should show the Convert button - without attribute', () => {
        const cheWorkspace = cheWorkspaceBuilder.build();
        const store = fakeStoreBuilder.withCheWorkspaces({ workspaces: [cheWorkspace] }).build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const showConvertButton = screen.queryByTestId('props-show-convert-button');
        expect(showConvertButton).toHaveTextContent('true');
      });

      it('should show the Convert button - with attribute', async () => {
        const cheWorkspace = cheWorkspaceBuilder
          .withAttributes({
            convertedId: devWorkspaceId,
          } as che.WorkspaceAttributes)
          .build();
        const store = new FakeStoreBuilder()
          .withCheWorkspaces({ workspaces: [cheWorkspace] })
          .build();

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const showConvertButton = screen.queryByTestId('props-show-convert-button');
        expect(showConvertButton).toHaveTextContent('true');
      });

      it('should convert devfile and create a new DevWorkspace', async () => {
        const cheWorkspace = cheWorkspaceBuilder.build();
        const devWorkspace = devWorkspaceBuilder
          .withMetadata({
            annotations: {
              [ORIGINAL_WORKSPACE_ID_ANNOTATION]: cheWorkspaceId,
            },
          })
          .build();
        const store = fakeStoreBuilder
          .withCheWorkspaces({ workspaces: [cheWorkspace] })
          .withDevWorkspaces({ workspaces: [devWorkspace] })
          .build();

        const spyHistoryReplace = jest.spyOn(routeProps.history, 'replace');

        render(
          <Provider store={store}>
            <WorkspaceDetailsContainer {...routeProps} />
          </Provider>,
        );

        const convertButton = screen.getByRole('button', { name: 'Convert' });
        userEvent.click(convertButton);

        await waitFor(() =>
          expect(spyHistoryReplace).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: `/workspace/${devNamespace}/${workspaceName}` }),
          ),
        );

        expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalledWith<
          Parameters<ActionCreators['createWorkspaceFromDevfile']>
        >(
          expect.objectContaining({
            metadata: expect.objectContaining({
              attributes: expect.objectContaining({
                [DEVWORKSPACE_METADATA_ANNOTATION]: {
                  [ORIGINAL_WORKSPACE_ID_ANNOTATION]: cheWorkspaceId,
                  [DEVWORKSPACE_ID_OVERRIDE_ANNOTATION]: cheWorkspaceId,
                },
              }),
            }),
          } as devfileApi.DevfileLike),
          undefined,
          devNamespace,
          {},
          {},
          false,
        );

        expect(mockUpdateWorkspace).toHaveBeenCalledWith<
          Parameters<ActionCreators['updateWorkspace']>
        >(
          expect.objectContaining({
            ref: expect.objectContaining({
              attributes: expect.objectContaining({
                convertedId: devWorkspaceId,
              }),
            }),
          }),
        );
      });
    });
  });
});
