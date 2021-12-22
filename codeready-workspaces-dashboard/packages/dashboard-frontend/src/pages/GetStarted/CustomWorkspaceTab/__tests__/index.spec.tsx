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

import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import React, { BaseSyntheticEvent, forwardRef } from 'react';
import { RenderResult, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockMetadata from '../../__tests__/devfileMetadata.json';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import * as FactoryResolverStore from '../../../../store/FactoryResolver';
import * as DevfileRegistriesStore from '../../../../store/DevfileRegistries';
import { AppThunk } from '../../../../store';
import { toTitle } from '../../../../services/storageTypes';

import CustomWorkspaceTab from '..';
import { FactoryResolver } from '../../../../services/helpers/types';
import { Devfile } from '../../../../services/workspace-adapter';
import { ConvertedState } from '../../../../store/FactoryResolver';

jest.mock('../../../../components/DevfileEditor', () => {
  return forwardRef(function DummyEditor(...args: any[]): React.ReactElement {
    const { devfile, onChange } = args[0];
    const devfileStr = JSON.stringify(devfile);
    function onContentChange(event: BaseSyntheticEvent) {
      event.persist();
      const { value } = event.target;
      /* Expected an empty value and a valid JSON string */
      if (!value) {
        onChange(value, false);
      } else {
        onChange(value, true);
      }
    }
    const input = (
      <input
        data-testid="dummy-editor"
        name="dummy-editor"
        type="text"
        onChange={onContentChange}
        value={devfileStr}
      />
    );
    return input;
  });
});

const dummyDevfile = {
  apiVersion: '1.0.0',
  metadata: {
    name: 'Java Maven',
  },
} as Devfile;
jest.mock('../../../../store/DevfileRegistries', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requestDevfile:
        (location: string): AppThunk<Action, Promise<string>> =>
        async (): Promise<string> => {
          return Promise.resolve(JSON.stringify(dummyDevfile));
        },
      requestJsonSchema: (): AppThunk<Action, Promise<void>> => async (): Promise<void> =>
        Promise.resolve(),
      requestRegistriesMetadata: (): AppThunk<Action, Promise<void>> => async (): Promise<void> =>
        Promise.resolve(),
      clearFilter: (): AppThunk<Action, void> => (): void => {
        return;
      },
      setFilter: (): AppThunk<Action, void> => (): void => {
        return;
      },
    } as DevfileRegistriesStore.ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

jest.mock('../../../../store/FactoryResolver/index.ts', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      requestFactoryResolver:
        (location: string): AppThunk<Action, Promise<void>> =>
        async (dispatch): Promise<void> => {
          return Promise.resolve();
        },
    } as FactoryResolverStore.ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

describe('Custom Workspace Tab', () => {
  const defaultInfrastructureNamespace = undefined;
  const initialDevfile: Devfile = {
    apiVersion: '1.0.0',
    metadata: {
      generateName: 'wksp-',
    },
  } as Devfile;

  function renderComponent(store: Store, onDevfile: jest.Mock): RenderResult {
    return render(
      <Provider store={store}>
        <CustomWorkspaceTab onDevfile={onDevfile} />
      </Provider>,
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all nested components', () => {
    const store = createStore();
    renderComponent(store, jest.fn());

    screen.getByRole('textbox', { name: /workspace name/i });
    screen.getByRole('textbox', { name: /select a devfile template/i });
    screen.getByRole('textbox', { name: /url of devfile/i });
    screen.getByRole('button', { name: /(?:async|ephemeral|persistent)/i });
    screen.getByRole('button', { name: /select a devfile template/i });
    screen.getByRole('button', { name: /load devfile/i });
    screen.getByRole('button', { name: /create & open/i });
  });

  it('should use default template with schema version "2.1.0" if devworkspaces is enabled', () => {
    const store = createStore({
      isDevworkspacesEnabled: true,
    });
    const mockOnDevfile = jest.fn();
    renderComponent(store, mockOnDevfile);

    clickOnCreateAndOpenButton();

    expect(mockOnDevfile).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: '2.1.0',
      }),
      defaultInfrastructureNamespace,
      undefined,
    );
  });

  it('should handle click on "Create & Open" button', () => {
    const defaultStorageType = 'persistent';
    const store = createStore({
      defaultStorageType,
    });
    const mockOnDevfile = jest.fn();
    renderComponent(store, mockOnDevfile);

    clickOnCreateAndOpenButton();

    expect(mockOnDevfile).toHaveBeenCalledWith(
      initialDevfile,
      defaultInfrastructureNamespace,
      undefined,
    );
  });

  describe('workspace name field', () => {
    it('should handle workspace name changing', () => {
      const defaultStorageType = 'persistent';
      const store = createStore({
        defaultStorageType,
      });
      const mockOnDevfile = jest.fn((devfile: Devfile, namespace: che.KubernetesNamespace) => {
        expect(namespace).toEqual(defaultInfrastructureNamespace);
        const expectedMeta = {
          name: 'new-workspace-name',
        };
        expect(devfile).toMatchObject({
          metadata: expectedMeta,
        });
      });
      renderComponent(store, mockOnDevfile);

      /* set workspace name */
      const workspaceNameTextbox = screen.getByRole('textbox', { name: /workspace name/i });
      userEvent.type(workspaceNameTextbox, 'new-workspace-name');

      clickOnCreateAndOpenButton();

      expect(mockOnDevfile).toHaveBeenCalled();
    });
  });

  describe('storage type field', () => {
    it('should handle storage type changing', () => {
      const defaultStorageType = 'persistent';
      const store = createStore({
        defaultStorageType,
      });
      const mockOnDevfile = jest.fn((devfile: Devfile, namespace: che.KubernetesNamespace) => {
        expect(namespace).toEqual(defaultInfrastructureNamespace);
        const expectedAttributes: che.WorkspaceDevfileAttributes = {
          asyncPersist: 'true',
          persistVolumes: 'false',
        };
        expect(devfile).toMatchObject({
          attributes: expectedAttributes,
        });
      });
      renderComponent(store, mockOnDevfile);

      /* expand list of options */
      const defaultStorageTitle = toTitle(defaultStorageType);
      const storageTypeToggle = screen.getByRole('button', { name: defaultStorageTitle });
      userEvent.click(storageTypeToggle);

      /* choose another storage type */
      const nextStorageTitle = toTitle('async');
      const asyncStorageOption = screen.getByRole('option', { name: nextStorageTitle });
      expect(asyncStorageOption).toBeInTheDocument();
      userEvent.click(asyncStorageOption);

      clickOnCreateAndOpenButton();

      expect(mockOnDevfile).toHaveBeenCalled();
    });
  });

  describe('devfile selector', () => {
    it('should handle selecting a devfile template', async () => {
      const store = createStore();
      const mockOnDevfile = jest.fn();
      renderComponent(store, mockOnDevfile);

      /* expand list of options */
      const selectTemplateToggle = screen.getByRole('button', {
        name: /select a devfile template/i,
      });
      userEvent.click(selectTemplateToggle);

      /* choose a template */
      const templateName = 'Java Maven';
      const templateOption = screen.getByRole('option', { name: templateName });
      expect(templateOption).toBeInTheDocument();
      userEvent.click(templateOption);

      /* wait until chosen option is applied */
      await waitFor(() => screen.queryAllByText(templateName));

      clickOnCreateAndOpenButton();

      expect(mockOnDevfile.mock.calls[0][0]).toEqual(expect.objectContaining(dummyDevfile));
      expect(mockOnDevfile).toHaveBeenCalledWith(
        expect.anything(),
        defaultInfrastructureNamespace,
        undefined,
      );
    });

    it('should handle loading custom devfile', async () => {
      const devfileName = 'Custom Devfile';
      const dummyCustomDevfile = {
        apiVersion: '1.0.0',
        metadata: { name: devfileName },
      } as Devfile;

      const store = createStore();
      const mockOnDevfile = jest.fn();
      renderComponent(store, mockOnDevfile);

      /* type a devfile location */
      const locationTextbox = screen.getByRole('textbox', { name: /url of devfile/i });
      userEvent.type(locationTextbox, 'http://registry/location');

      /* click "Load Devfile" button */
      const loadDevfileButton = screen.getByRole('button', { name: /load devfile/i });
      await waitFor(() => {
        expect(loadDevfileButton).toBeEnabled();
      });
      userEvent.click(loadDevfileButton);

      /* wait until custom devfile is loaded */
      await waitFor(() => screen.queryAllByText(devfileName));

      clickOnCreateAndOpenButton();

      expect(mockOnDevfile.mock.calls[0][0]).toEqual(expect.objectContaining(dummyCustomDevfile));
      expect(mockOnDevfile).toHaveBeenCalledWith(
        expect.anything(),
        defaultInfrastructureNamespace,
        undefined,
      );
    });
  });

  describe('devfile editor', () => {
    it("should correctly apply the preferred storage type 'persistent'", () => {
      const defaultStorageType = 'persistent';
      renderComponent(createStore({ defaultStorageType }), jest.fn());

      const editorTextbox = screen.getByTestId('dummy-editor') as HTMLInputElement;
      expect(editorTextbox.value).not.toContain('"persistVolumes":');
      expect(editorTextbox.value).not.toContain('"asyncPersist":');
    });

    it("should correctly apply the preferred storage type 'ephemeral'", () => {
      const defaultStorageType = 'ephemeral';
      renderComponent(createStore({ defaultStorageType }), jest.fn());

      const editorTextbox = screen.getByTestId('dummy-editor') as HTMLInputElement;
      expect(editorTextbox.value).toContain('"persistVolumes":"false"');
      expect(editorTextbox.value).not.toContain('"asyncPersist":');
    });

    it("should correctly apply the preferred storage type 'async'", () => {
      const defaultStorageType = 'async';
      renderComponent(createStore({ defaultStorageType }), jest.fn());

      const editorTextbox = screen.getByTestId('dummy-editor') as HTMLInputElement;
      expect(editorTextbox.value).toContain('"persistVolumes":"false"');
      expect(editorTextbox.value).toContain('"asyncPersist":"true"');
    });

    it('should handle updating a devfile content', async () => {
      const defaultStorageType = 'persistent';
      const store = createStore({ defaultStorageType });
      const mockOnDevfile = jest.fn();
      renderComponent(store, mockOnDevfile);

      const editorTextbox = screen.getByTestId('dummy-editor');
      expect(editorTextbox).toBeInTheDocument();

      expect(editorTextbox).toHaveValue(JSON.stringify(initialDevfile));

      /* change devfile content in editor */
      fireEvent.change(editorTextbox, { target: { value: '' } });
      const newDevfile = {
        apiVersion: '1.0.0',
        metadata: {
          name: 'Manually-Typed-Devfile',
        },
      };
      fireEvent.change(editorTextbox, {
        target: {
          value: JSON.stringify(newDevfile),
        },
      });

      await waitFor(() => {
        screen.queryByText('Manually Typed Devfile');
      });

      clickOnCreateAndOpenButton();

      expect(mockOnDevfile.mock.calls[0][0]).toEqual(expect.objectContaining(newDevfile));
      expect(mockOnDevfile).toHaveBeenCalledWith(
        expect.anything(),
        defaultInfrastructureNamespace,
        undefined,
      );
    });
  });
});

function clickOnCreateAndOpenButton() {
  const createButton = screen.getByRole('button', { name: /create & open/i });
  userEvent.click(createButton);
}

function createStore(
  opts: {
    defaultStorageType?: che.WorkspaceStorageType;
    isDevworkspacesEnabled?: boolean;
  } = {},
): Store {
  return new FakeStoreBuilder()
    .withDevfileRegistries({
      registries: {
        'registry-location': {
          metadata: mockMetadata,
        },
      },
    })
    .withFactoryResolver(
      {
        devfile: {
          apiVersion: '1.0.0',
          metadata: { name: 'Custom Devfile' },
        } as Devfile,
      } as FactoryResolver,
      {
        isConverted: false,
      } as ConvertedState,
    )
    .withBranding({
      docs: {
        storageTypes: 'https://che-docs/storage-types',
      },
    } as any)
    .withWorkspacesSettings({
      'che.workspace.storage.available_types': 'async,ephemeral,persistent',
      'che.workspace.storage.preferred_type': opts.defaultStorageType
        ? opts.defaultStorageType
        : 'ephemeral',
      'che.devworkspaces.enabled': opts.isDevworkspacesEnabled ? 'true' : 'false',
    } as che.WorkspaceSettings)
    .build();
}
