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

import { pod1, pod2 } from '@/store/Pods/__tests__/stub';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as testStore from '..';

describe('Pods store, reducers', () => {
  it('should return initial state', () => {
    const incomingAction: testStore.RequestPodsAction = {
      type: testStore.Type.REQUEST_PODS,
      check: AUTHORIZED,
    };
    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [],
      resourceVersion: '0',
    };

    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: true,
      pods: [pod1, pod2],
      resourceVersion: '0',
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    } as AnyAction;
    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      pods: [pod1, pod2],
      resourceVersion: '0',
    };
    expect(newState).toEqual(expectedState);
  });

  it('should handle REQUEST_PODS', () => {
    const initialState: testStore.State = {
      isLoading: false,
      pods: [],
      error: 'unexpected error',
      resourceVersion: '0',
    };
    const incomingAction: testStore.RequestPodsAction = {
      type: testStore.Type.REQUEST_PODS,
      check: AUTHORIZED,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      pods: [],
      resourceVersion: '0',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_PODS', () => {
    const initialState: testStore.State = {
      isLoading: true,
      pods: [],
      resourceVersion: '0',
    };
    const incomingAction: testStore.ReceivePodsAction = {
      type: testStore.Type.RECEIVE_PODS,
      pods: [pod1, pod2],
      resourceVersion: '1',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [pod1, pod2],
      resourceVersion: '1',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      pods: [],
      resourceVersion: '0',
    };
    const incomingAction: testStore.ReceiveErrorAction = {
      type: testStore.Type.RECEIVE_ERROR,
      error: 'unexpected error',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [],
      error: 'unexpected error',
      resourceVersion: '0',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_POD', () => {
    const initialState: testStore.State = {
      isLoading: false,
      pods: [pod1],
      resourceVersion: '0',
    };

    const newPod = cloneDeep(pod2);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    newPod.metadata!.resourceVersion = '1234';

    const incomingAction: testStore.ReceivePodAction = {
      type: testStore.Type.RECEIVE_POD,
      pod: newPod,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [pod1, newPod],
      resourceVersion: '1234',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle MODIFY_POD', () => {
    const initialState: testStore.State = {
      isLoading: false,
      pods: [pod1, pod2],
      resourceVersion: '0',
    };

    const modifiedPod = cloneDeep(pod1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    modifiedPod.metadata!.resourceVersion = '2345';

    const incomingAction: testStore.ModifyPodAction = {
      type: testStore.Type.MODIFY_POD,
      pod: modifiedPod,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [modifiedPod, pod2],
      resourceVersion: '2345',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle DELETE_POD', () => {
    const initialState: testStore.State = {
      isLoading: false,
      pods: [pod1, pod2],
      resourceVersion: '0',
    };

    const deletedPod = cloneDeep(pod1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    deletedPod.metadata!.resourceVersion = '3456';

    const incomingAction: testStore.DeletePodAction = {
      type: testStore.Type.DELETE_POD,
      pod: deletedPod,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      pods: [pod2],
      resourceVersion: '3456',
    };

    expect(newState).toEqual(expectedState);
  });
});
