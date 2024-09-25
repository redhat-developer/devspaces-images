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

const editorDefinition = 'che-incubator/che-code/insiders';
const editorImage = 'custom-editor-image';

describe('Samples List', () => {
  const sampleUrl = 'https://github.com/che-samples/quarkus-quickstarts/tree/devfilev2';
  const origin = window.location.origin;
  let storeBuilder: FakeStoreBuilder;
  let mockWindowOpen: jest.Mock;

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

    mockWindowOpen = jest.fn();
    window.open = mockWindowOpen;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('preferred storage: non-ephemeral', () => {
    const preferredPvcStrategy = 'per-workspace';
    let store: Store;

    beforeEach(() => {
      store = storeBuilder
        .withDwServerConfig({
          defaults: {
            pvcStrategy: preferredPvcStrategy,
          } as api.IServerConfig['defaults'],
        })
        .build();
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store, editorDefinition, editorImage);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('default storage type', async () => {
      renderComponent(store, editorDefinition, editorImage);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('false');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=${preferredPvcStrategy}`,
        '_blank',
      );
    });

    test('toggled storage type', async () => {
      renderComponent(store, editorDefinition, editorImage);

      const toggleIsTemporaryButton = screen.getByRole('button', { name: 'Toggle isTemporary' });
      await userEvent.click(toggleIsTemporaryButton);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('true');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

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

    beforeEach(() => {
      store = storeBuilder
        .withDwServerConfig({
          defaults: {
            pvcStrategy: preferredPvcStrategy,
          } as api.IServerConfig['defaults'],
        })
        .build();
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store, editorDefinition, editorImage);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('default storage type', async () => {
      renderComponent(store, editorDefinition, editorImage);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('true');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=${preferredPvcStrategy}`,
        '_blank',
      );
    });

    test('toggled storage type', async () => {
      renderComponent(store, editorDefinition, editorImage);

      const toggleIsTemporaryButton = screen.getByRole('button', { name: 'Toggle isTemporary' });
      await userEvent.click(toggleIsTemporaryButton);

      const isTemporary = screen.getByTestId('isTemporary');
      expect(isTemporary).toHaveTextContent('false');

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=persistent`,
        '_blank',
      );
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('DevWorkspace prebuilt resources', () => {
    const preferredPvcStrategy = 'ephemeral';

    beforeEach(() => {
      storeBuilder
        .withDwServerConfig({
          defaults: {
            pvcStrategy: preferredPvcStrategy,
            editor: 'che-incubator/che-idea/next',
          } as api.IServerConfig['defaults'],
        })
        .build();
    });

    test('provided editor matches some resource', async () => {
      const store = storeBuilder.build();
      renderComponent(store, editorDefinition, editorImage);

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-code%2Finsiders&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-code-insiders.yaml&editor-image=custom-editor-image&storageType=ephemeral`,
        '_blank',
      );
    });

    test('provided editor does not match any resource', async () => {
      const store = storeBuilder.build();
      renderComponent(store, 'my/custom/editor', editorImage);

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=my%2Fcustom%2Feditor&editor-image=custom-editor-image&storageType=ephemeral`,
        '_blank',
      );
    });

    test('default editor matches some resource', async () => {
      const store = storeBuilder
        .withDwPlugins({}, {}, false, [], undefined, 'che-incubator/che-idea/next')
        .build();
      renderComponent(store, undefined, undefined);

      const sampleCardButton = screen.getByRole('button', { name: 'Select Sample' });
      await userEvent.click(sampleCardButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `${origin}#${sampleUrl}?df=devfile2.yaml&che-editor=che-incubator%2Fche-idea%2Fnext&devWorkspace=registry-url%2Fdevfile-registry%2Fdevfiles%2Fquarkus%2Fdevworkspace-che-idea-next.yaml&storageType=ephemeral`,
        '_blank',
      );
    });
  });
});

function getComponent(
  store: Store,
  editorDefinition: string | undefined,
  editorImage: string | undefined,
) {
  return (
    <Provider store={store}>
      <SamplesList editorDefinition={editorDefinition} editorImage={editorImage} />
    </Provider>
  );
}
