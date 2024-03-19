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

import { api } from '@eclipse-che/common';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import SamplesList from '@/pages/GetStarted/SamplesList';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/pages/GetStarted/SamplesList/Gallery');
jest.mock('@/pages/GetStarted/SamplesList/Toolbar');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const editorId = 'che-incubator/che-code/insiders';
const editorImage = 'custom-editor-image';

describe('Samples List', () => {
  const sampleUrl = 'https://github.com/che-samples/quarkus-quickstarts/tree/devfilev2';
  const origin = window.location.origin;
  let storeBuilder: FakeStoreBuilder;

  beforeEach(() => {
    storeBuilder = new FakeStoreBuilder()
      .withBranding({
        docs: {
          storageTypes: 'storage-types-docs',
        },
      } as BrandingData)
      .withDevfileRegistries({
        registries: {
          ['registry-url']: {
            metadata: [
              {
                displayName: 'Quarkus REST API',
                description: 'Quarkus stack with a default REST endpoint application sample',
                tags: ['Community', 'Java', 'Quarkus', 'OpenJDK', 'Maven', 'Debian'],
                icon: '/images/quarkus.svg',
                links: {
                  v2: `${sampleUrl}?df=devfile2.yaml`,
                  devWorkspaces: {
                    'che-incubator/che-code/insiders':
                      'registry-url/devfile-registry/devfiles/quarkus/devworkspace-che-code-insiders.yaml',
                    'che-incubator/che-code/latest':
                      'registry-url/devfile-registry/devfiles/quarkus/devworkspace-che-code-latest.yaml',
                    'che-incubator/che-idea/next':
                      'registry-url/devfile-registry/devfiles/quarkus/devworkspace-che-idea-next.yaml',
                  },
                },
              },
            ],
          },
        },
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('preferred storage: non-ephemeral', () => {
    const preferredPvcStrategy = 'per-workspace';

    let store: Store;
    let mockWindowOpen: jest.Mock;

    beforeEach(() => {
      store = storeBuilder
        .withDwServerConfig({
          defaults: {
            pvcStrategy: preferredPvcStrategy,
          } as api.IServerConfig['defaults'],
        })
        .build();

      mockWindowOpen = jest.fn();
      window.open = mockWindowOpen;
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('default storage type', () => {
      renderComponent(store);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('false');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=${preferredPvcStrategy}`,
        '_blank',
      );
    });

    test('toggled storage type', () => {
      renderComponent(store);

      const toggleIsTemporaryButton = screen.getByRole('button', { name: 'Toggle isTemporary' });
      userEvent.click(toggleIsTemporaryButton);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('true');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=ephemeral`,
        '_blank',
      );
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('preferred storage: ephemeral', () => {
    const preferredPvcStrategy = 'ephemeral';

    let store: Store;
    let mockWindowOpen: jest.Mock;

    beforeEach(() => {
      store = storeBuilder
        .withDwServerConfig({
          defaults: {
            pvcStrategy: preferredPvcStrategy,
          } as api.IServerConfig['defaults'],
        })
        .build();

      mockWindowOpen = jest.fn();
      window.open = mockWindowOpen;
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('default storage type', () => {
      renderComponent(store);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('true');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=${preferredPvcStrategy}`,
        '_blank',
      );
    });

    test('toggled storage type', () => {
      renderComponent(store);

      const toggleIsTemporaryButton = screen.getByRole('button', { name: 'Toggle isTemporary' });
      userEvent.click(toggleIsTemporaryButton);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('false');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=persistent`,
        '_blank',
      );
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    });
  });
});

function getComponent(store: Store) {
  const history = createMemoryHistory();

  return (
    <Provider store={store}>
      <SamplesList editorDefinition={editorId} editorImage={editorImage} history={history} />
    </Provider>
  );
}
