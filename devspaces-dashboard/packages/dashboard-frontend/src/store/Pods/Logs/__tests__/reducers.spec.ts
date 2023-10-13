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

import { AnyAction } from 'redux';

import * as testStore from '..';

describe('Logs store, reducers', () => {
  const podName = 'pod1';
  const containerName = 'container1';

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      logs: {},
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    } as AnyAction;
    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      logs: {},
    };
    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_LOGS when no state', () => {
    const incomingAction: testStore.ReceiveLogsAction = {
      type: testStore.Type.RECEIVE_LOGS,
      podName,
      containerName,
      logs: 'new logs',
      failure: false,
    };

    const newState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      logs: {
        [podName]: {
          containers: {
            [containerName]: {
              logs: 'new logs',
              failure: false,
            },
          },
        },
      },
    };

    expect(newState).toEqual(expectedState);
  });

  describe('should handle RECEIVE_LOGS', () => {
    it('when no other logs', () => {
      const initialState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: '',
                failure: false,
              },
            },
          },
        },
      };
      const incomingAction: testStore.ReceiveLogsAction = {
        type: testStore.Type.RECEIVE_LOGS,
        podName,
        containerName,
        logs: 'new logs',
        failure: false,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'new logs',
                failure: false,
              },
            },
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('when have some logs', () => {
      const initialState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'prev logs\n',
                failure: false,
              },
            },
          },
        },
      };
      const incomingAction: testStore.ReceiveLogsAction = {
        type: testStore.Type.RECEIVE_LOGS,
        podName,
        containerName,
        logs: 'new logs',
        failure: false,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'prev logs\nnew logs',
                failure: false,
              },
            },
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('when have failure and received logs', () => {
      const initialState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'something went wrong',
                failure: true,
              },
            },
          },
        },
      };
      const incomingAction: testStore.ReceiveLogsAction = {
        type: testStore.Type.RECEIVE_LOGS,
        podName,
        containerName,
        logs: 'new logs',
        failure: false,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'new logs',
                failure: false,
              },
            },
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('when no other logs and receive failure', () => {
      const initialState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: '',
                failure: false,
              },
            },
          },
        },
      };
      const incomingAction: testStore.ReceiveLogsAction = {
        type: testStore.Type.RECEIVE_LOGS,
        podName,
        containerName,
        logs: 'something went wrong',
        failure: true,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'something went wrong',
                failure: true,
              },
            },
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('when no have some logs and receive failure', () => {
      const initialState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'prev logs\n',
                failure: false,
              },
            },
          },
        },
      };
      const incomingAction: testStore.ReceiveLogsAction = {
        type: testStore.Type.RECEIVE_LOGS,
        podName,
        containerName,
        logs: 'something went wrong',
        failure: true,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        logs: {
          [podName]: {
            containers: {
              [containerName]: {
                logs: 'something went wrong',
                failure: true,
              },
            },
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });
  });

  it('should handle DELETE_LOGS', () => {
    const initialState: testStore.State = {
      logs: {
        [podName]: {
          containers: {
            [containerName]: {
              logs: 'some logs\n',
              failure: false,
            },
          },
        },
      },
    };

    const incomingAction: testStore.DeleteLogsAction = {
      type: testStore.Type.DELETE_LOGS,
      podName,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      logs: {},
    };

    expect(newState).toEqual(expectedState);
  });
});
