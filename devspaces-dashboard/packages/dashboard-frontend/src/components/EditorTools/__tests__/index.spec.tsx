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

import { ApplicationId } from '@eclipse-che/common';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import EditorTools from '..';

jest.mock('../../../contexts/ToggleBars');

const mockClipboard = jest.fn();
jest.mock('react-copy-to-clipboard', () => {
  return {
    __esModule: true,
    default: (props: any) => {
      return (
        <button
          onClick={() => {
            mockClipboard(props.text);
            props.onCopy();
          }}
        >
          Copy to clipboard
        </button>
      );
    },
  };
});

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const mockOnExpand = jest.fn();
let store: Store;

describe('EditorTools', () => {
  const clusterConsole = {
    id: ApplicationId.CLUSTER_CONSOLE,
    url: 'https://console-url',
    icon: 'https://console-icon-url',
    title: 'Cluster console',
  };

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withClusterInfo({
        applications: [clusterConsole],
      })
      .build();

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Devfile', () => {
    let devfile: devfileApi.Devfile;

    beforeEach(() => {
      devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'my-project',
          namespace: 'user-che',
        },
      };
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(devfile);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('expand and compress', () => {
      renderComponent(devfile);

      /* expand the editor */

      const expandButtonName = 'Expand';
      expect(screen.getByRole('button', { name: expandButtonName })).toBeTruthy;

      screen.getByRole('button', { name: expandButtonName }).click();
      expect(mockOnExpand).toHaveBeenCalledWith(true);

      /* compress the editor */

      const compressButtonName = 'Compress';
      expect(screen.getByRole('button', { name: compressButtonName })).toBeTruthy;

      screen.getByRole('button', { name: compressButtonName }).click();
      expect(mockOnExpand).toHaveBeenCalledWith(false);
    });

    test('copy to clipboard', () => {
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob-url');
      URL.createObjectURL = mockCreateObjectURL;

      renderComponent(devfile);

      const copyButtonName = 'Copy to clipboard';
      expect(screen.queryByRole('button', { name: copyButtonName })).toBeTruthy;

      screen.getByRole('button', { name: copyButtonName }).click();

      expect(mockClipboard).toHaveBeenCalledWith(
        'schemaVersion: 2.1.0\nmetadata:\n  name: my-project\n  namespace: user-che\n',
      );

      /* 'Copy to clipboard' should be hidden for a while */

      expect(screen.queryByRole('button', { name: copyButtonName })).toBeFalsy;

      const copyButtonNameAfter = 'Copied';
      expect(screen.queryByRole('button', { name: copyButtonNameAfter })).toBeTruthy;

      /* 'Copy to clipboard' should re-appear after 3000ms */

      jest.advanceTimersByTime(4000);
      expect(screen.queryByRole('button', { name: copyButtonName })).toBeTruthy;
      expect(screen.queryByRole('button', { name: copyButtonNameAfter })).toBeFalsy;
    });
  });

  describe('DevWorkspace', () => {
    let devWorkspace: devfileApi.DevWorkspace;

    beforeEach(() => {
      devWorkspace = {
        apiVersion: '1.0.0',
        metadata: {
          name: 'my-project',
          namespace: 'user-che',
          labels: {},
          uid: '123',
        },
        kind: 'DevWorkspace',
        spec: {
          template: {},
          started: true,
        },
      };
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(devWorkspace);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('Cluster Console', () => {
      renderComponent(devWorkspace);

      const clusterConsoleButton = screen.getByRole('link', { name: clusterConsole.title });

      expect(clusterConsoleButton.textContent).toEqual(clusterConsole.title);
    });
  });
});

function getComponent(devfileOrDevWorkspace: devfileApi.Devfile | devfileApi.DevWorkspace) {
  return (
    <Provider store={store}>
      <EditorTools devfileOrDevWorkspace={devfileOrDevWorkspace} handleExpand={mockOnExpand} />
    </Provider>
  );
}
