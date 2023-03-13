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

import { cloneDeep } from 'lodash';
import { AnyAction } from 'redux';
import * as testStore from '..';
import devfileApi from '../../../../services/devfileApi';
import { DevWorkspaceStatus } from '../../../../services/helpers/types';
import { WorkspaceAdapter } from '../../../../services/workspace-adapter';
import { AUTHORIZED } from '../../../sanityCheckMiddleware';
import { DevWorkspaceBuilder } from '../../../__mocks__/devWorkspaceBuilder';

describe('DevWorkspace, reducers', () => {
  let devWorkspace: devfileApi.DevWorkspace;

  beforeEach(() => {
    devWorkspace = new DevWorkspaceBuilder()
      .withStatus({ devworkspaceId: 'devworkspaceId' })
      .build();
  });

  it('should return initial state', () => {
    const incomingAction: testStore.RequestDevWorkspacesAction = {
      type: testStore.Type.REQUEST_DEVWORKSPACE,
      check: AUTHORIZED,
    };
    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    expect(initialState).toStrictEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    } as AnyAction;
    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };
    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle REQUEST_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      error: 'unexpected error',
      resourceVersion: '0',
      warnings: {},
    };
    const incomingAction: testStore.RequestDevWorkspacesAction = {
      type: testStore.Type.REQUEST_DEVWORKSPACE,
      check: AUTHORIZED,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
      error: undefined,
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle RECEIVE_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };
    const incomingAction: testStore.ReceiveWorkspacesAction = {
      type: testStore.Type.RECEIVE_DEVWORKSPACE,
      workspaces: [devWorkspace],
      resourceVersion: '1',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '1',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle RECEIVE_DEVWORKSPACE_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };
    const incomingAction: testStore.ReceiveErrorAction = {
      type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
      error: 'Error',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      error: 'Error',
      resourceVersion: '0',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle UPDATE_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    const updatedWorkspace = cloneDeep(devWorkspace);
    updatedWorkspace.status = {
      phase: 'Running',
      devworkspaceId: WorkspaceAdapter.getId(devWorkspace),
    };

    const incomingAction: testStore.UpdateWorkspaceAction = {
      type: testStore.Type.UPDATE_DEVWORKSPACE,
      workspace: updatedWorkspace,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [updatedWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle ADD_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    const incomingAction: testStore.AddWorkspaceAction = {
      type: testStore.Type.ADD_DEVWORKSPACE,
      workspace: devWorkspace,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle TERMINATE_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    const incomingAction: testStore.TerminateWorkspaceAction = {
      type: testStore.Type.TERMINATE_DEVWORKSPACE,
      workspaceUID: WorkspaceAdapter.getUID(devWorkspace),
      message: 'Terminated',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const updatedWorkspace = cloneDeep(devWorkspace);
    updatedWorkspace.status = {
      phase: DevWorkspaceStatus.TERMINATING,
      devworkspaceId: WorkspaceAdapter.getId(devWorkspace),
      message: 'Terminated',
    };
    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [updatedWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle DELETE_DEVWORKSPACE', () => {
    const initialState: testStore.State = {
      isLoading: true,
      workspaces: [devWorkspace],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    const incomingAction: testStore.DeleteWorkspaceAction = {
      type: testStore.Type.DELETE_DEVWORKSPACE,
      workspace: devWorkspace,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    expect(newState).toStrictEqual(expectedState);
  });

  it('should handle UPDATE_WARNING', () => {
    const initialState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {},
    };

    const incomingAction: testStore.UpdateWarningAction = {
      type: testStore.Type.UPDATE_WARNING,
      workspace: devWorkspace,
      warning: 'Unsupported Devfile feature',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      workspaces: [],
      startedWorkspaces: {},
      resourceVersion: '0',
      warnings: {
        [WorkspaceAdapter.getUID(devWorkspace)]: 'Unsupported Devfile feature',
      },
    };

    expect(newState).toStrictEqual(expectedState);
  });
});
