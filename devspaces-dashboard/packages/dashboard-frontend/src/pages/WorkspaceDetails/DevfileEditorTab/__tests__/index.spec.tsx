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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dump, load } from 'js-yaml';
import React from 'react';
import { Provider } from 'react-redux';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { Store } from 'redux';
import EditorTab from '..';
import { container } from '../../../../inversify.config';
import devfileApi from '../../../../services/devfileApi';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '../../../../services/devfileApi/devWorkspace/spec/template';
import { constructWorkspace, Workspace } from '../../../../services/workspace-adapter';
import {
  DevWorkspaceClient,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';

// uses the Devfile Editor mock
jest.mock('../../../../components/DevfileEditor');
jest.mock('../../../../components/EditorTools', () => {
  const FakeEditorTools = () => <div>Editor Tools</div>;
  FakeEditorTools.displayName = 'EditorTools';
  return FakeEditorTools;
});

const mockOnSave = jest.fn();
const mockOnWorkspaceWarning = jest.fn();

describe('Editor Tab', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('devworkspaces', () => {
    const workspaceName = 'test-workspace';
    const namespace = 'test-ns';
    let workspace: Workspace;
    let store: Store;
    const initialMetadataAnnotationAttr = 'initial-metadata-annotation';

    beforeEach(() => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withName(workspaceName)
        .withNamespace(namespace)
        .withTemplate({
          attributes: {
            [DEVWORKSPACE_STORAGE_TYPE_ATTR]: 'ephemeral',
            [DEVWORKSPACE_METADATA_ANNOTATION]: initialMetadataAnnotationAttr,
          },
        })
        .build();

      const devWorkspaceCopy = JSON.parse(JSON.stringify(devWorkspace));
      // mock devworkspace method to be able to save the devfile
      class MockDevWorkspaceClient extends DevWorkspaceClient {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        async getWorkspaceByName(
          _namespace: string,
          _workspaceName: string,
        ): Promise<devfileApi.DevWorkspace> {
          return devWorkspaceCopy;
        }
        /* eslint-enable @typescript-eslint/no-unused-vars */
      }
      container.rebind(DevWorkspaceClient).to(MockDevWorkspaceClient).inSingletonScope();

      store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();
      workspace = constructWorkspace(devWorkspace);
    });

    it('should render the component', () => {
      const json = createSnapshot(store, workspace);
      expect(json).toMatchSnapshot();
    });

    it('should restore original content on Cancel', async () => {
      renderComponent(store, workspace);

      const expectedDevfile = Object.assign({}, workspace.devfile) as devfileApi.Devfile;
      delete (expectedDevfile.attributes as Record<string, unknown>)[
        DEVWORKSPACE_METADATA_ANNOTATION
      ];

      const newDevfile: devfileApi.Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'my-project',
          namespace: 'user-che',
        },
      };
      const newDevfileContent = dump(newDevfile);

      const editor = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.input(editor, {
        target: {
          value: newDevfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      await waitFor(() => expect(cancelButton).toBeEnabled());
      userEvent.click(cancelButton);

      await waitFor(() => expect(cancelButton).toBeDisabled());
      await waitFor(() => expect(saveButton).toBeDisabled());

      const receivedDevfile = load(editor.value);
      await waitFor(() => expect(receivedDevfile).toEqual(expectedDevfile));
    });

    it('should restore name', async () => {
      renderComponent(store, workspace);

      // copy the workspace devfile, remove 'name' field and paste new devfile into the editor
      const noNameDevfile = JSON.parse(JSON.stringify(workspace.devfile)) as devfileApi.Devfile;
      delete (noNameDevfile as devfileApi.DevfileLike).metadata?.name;
      const noNameDevfileContent = dump(noNameDevfile);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: {
          value: noNameDevfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(saveButton).toBeEnabled());
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({
            kind: 'DevWorkspace',
            metadata: expect.objectContaining({
              name: workspaceName,
            }),
          } as devfileApi.DevWorkspace),
        }),
      );
    });

    it('should restore namespace', async () => {
      renderComponent(store, workspace);

      // copy the workspace devfile, remove 'name' field and paste new devfile into the editor
      const noNamespaceDevfile = JSON.parse(
        JSON.stringify(workspace.devfile),
      ) as devfileApi.Devfile;
      delete (noNamespaceDevfile as devfileApi.DevfileLike).metadata?.namespace;
      const noNamespaceDevfileContent = dump(noNamespaceDevfile);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: {
          value: noNamespaceDevfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(saveButton).toBeEnabled());
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({
            kind: 'DevWorkspace',
            metadata: expect.objectContaining({
              namespace,
            }),
          } as devfileApi.DevWorkspace),
        }),
      );
    });

    it('should hide the devworkspace metadata attribute', async () => {
      renderComponent(store, workspace);

      const editor = screen.getByRole('textbox') as HTMLTextAreaElement;
      await waitFor(() => expect(editor.value).not.toContain(DEVWORKSPACE_METADATA_ANNOTATION));
    });

    it('should restore the devworkspace metadata attribute', async () => {
      renderComponent(store, workspace);

      // replace existing attributes with a new one
      const devfile = JSON.parse(JSON.stringify(workspace.devfile)) as devfileApi.Devfile;
      devfile.attributes = {
        'new-attribute': 'new-value',
      };
      const devfileContent = dump(devfile);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: {
          value: devfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(saveButton).toBeEnabled());
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({
            kind: 'DevWorkspace',
            spec: expect.objectContaining({
              template: expect.objectContaining({
                attributes: {
                  'new-attribute': 'new-value',
                  [DEVWORKSPACE_METADATA_ANNOTATION]: initialMetadataAnnotationAttr,
                },
              }),
            }),
          } as devfileApi.DevWorkspace),
        }),
      );
    });

    it('#1 should ignore the devworkspace metadata attribute typed in the editor', async () => {
      // the workspace already has DEVWORKSPACE_METADATA_ANNOTATION attribute
      renderComponent(store, workspace);

      // replace existing attributes
      const devfile = JSON.parse(JSON.stringify(workspace.devfile)) as devfileApi.Devfile;
      devfile.attributes = {
        'new-attribute': 'new-value',
        [DEVWORKSPACE_METADATA_ANNOTATION]: 'this-value-should-be ignored',
      };
      const devfileContent = dump(devfile);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: {
          value: devfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(saveButton).toBeEnabled());
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({
            kind: 'DevWorkspace',
            spec: expect.objectContaining({
              template: expect.objectContaining({
                attributes: {
                  'new-attribute': 'new-value',
                  [DEVWORKSPACE_METADATA_ANNOTATION]: initialMetadataAnnotationAttr,
                },
              }),
            }),
          } as devfileApi.DevWorkspace),
        }),
      );
    });

    it('#2 should ignore the devworkspace metadata attribute typed in the editor', async () => {
      // the workspace doesn't have the DEVWORKSPACE_METADATA_ANNOTATION attribute
      const devWorkspace = new DevWorkspaceBuilder()
        .withName(workspaceName)
        .withNamespace(namespace)
        .build();

      const devWorkspaceCopy = JSON.parse(JSON.stringify(devWorkspace));
      // mock devworkspace method to be able to save the devfile
      class MockDevWorkspaceClient extends DevWorkspaceClient {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        async getWorkspaceByName(
          _namespace: string,
          _workspaceName: string,
        ): Promise<devfileApi.DevWorkspace> {
          return devWorkspaceCopy;
        }
        /* eslint-enable @typescript-eslint/no-unused-vars */
      }
      container.rebind(DevWorkspaceClient).to(MockDevWorkspaceClient).inSingletonScope();

      workspace = constructWorkspace(devWorkspace);
      store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();
      renderComponent(store, workspace);

      // replace existing attributes
      const devfile = JSON.parse(JSON.stringify(workspace.devfile)) as devfileApi.Devfile;
      devfile.attributes = {
        'new-attribute': 'new-value',
        [DEVWORKSPACE_METADATA_ANNOTATION]: 'this-value-should-be ignored',
      };
      const devfileContent = dump(devfile);

      const editor = screen.getByRole('textbox');
      fireEvent.input(editor, {
        target: {
          value: devfileContent,
        },
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(saveButton).toBeEnabled());
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({
            kind: 'DevWorkspace',
            spec: expect.objectContaining({
              template: expect.objectContaining({
                attributes: {
                  'new-attribute': 'new-value',
                },
              }),
            }),
          } as devfileApi.DevWorkspace),
        }),
      );
    });
  });
});

type RenderParams = Parameters<typeof getComponent>;
function getComponent(store: Store, workspace: Workspace): React.ReactElement {
  return (
    <Provider store={store}>
      <EditorTab
        workspace={workspace}
        onSave={workspace => mockOnSave(workspace)}
        onDevWorkspaceWarning={() => mockOnWorkspaceWarning()}
        isRunning={workspace.isRunning}
      />
    </Provider>
  );
}

function renderComponent(...args: RenderParams): {
  reRenderComponent: (...args: RenderParams) => void;
} {
  const res = render(getComponent(...args));

  return {
    reRenderComponent: (...args) => {
      res.rerender(getComponent(...args));
    },
  };
}

function createSnapshot(...args: Parameters<typeof getComponent>): ReactTestRenderer {
  return renderer.create(getComponent(...args));
}
