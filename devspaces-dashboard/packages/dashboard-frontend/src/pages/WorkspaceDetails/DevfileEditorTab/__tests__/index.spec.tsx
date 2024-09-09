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

import userEvent from '@testing-library/user-event';
import { dump } from 'js-yaml';
import { cloneDeep } from 'lodash';
import React from 'react';

import { DevfileEditorTab, prepareDevfile } from '@/pages/WorkspaceDetails/DevfileEditorTab';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import {
  DEVWORKSPACE_DEVFILE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

jest.mock('@/components/EditorTools');
jest.mock('@/components/DevfileViewer');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('DevfileEditorTab', () => {
  let workspace: Workspace;

  beforeEach(() => {
    const devWorkspace = new DevWorkspaceBuilder().withName('wksp').build();
    workspace = constructWorkspace(devWorkspace);
  });

  describe('component', () => {
    test('snapshot', () => {
      const snapshot = createSnapshot(true, workspace);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('expanded state', async () => {
      renderComponent(true, workspace);

      const buttonExpand = screen.getByRole('button', { name: 'Expand Editor' });
      await userEvent.click(buttonExpand);

      const isExpanded = screen.getByTestId('devfile-viewer-is-expanded');
      expect(isExpanded).toHaveTextContent('true');
    });
  });

  describe('prepareDevfile', () => {
    describe('devWorkspace with the DEVWORKSPACE_DEVFILE annotation', () => {
      test('devfile without DEVWORKSPACE_METADATA_ANNOTATION', () => {
        const expectedDevfile = {
          schemaVersion: '2.1.0',
          metadata: {
            name: 'wksp',
            namespace: 'user-che',
            tags: ['tag1', 'tag2'],
          },
        } as devfileApi.Devfile;
        const devWorkspace = new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE]: dump(expectedDevfile),
            },
          })
          .build();
        const workspace = constructWorkspace(devWorkspace);

        const devfile = prepareDevfile(workspace);
        expect(devfile).toEqual(expectedDevfile);
      });

      test('devfile with DEVWORKSPACE_METADATA_ANNOTATION', () => {
        const origDevfile = {
          schemaVersion: '2.1.0',
          metadata: {
            name: 'wksp',
            namespace: 'user-che',
            tags: ['tag1', 'tag2'],
          },
          attributes: {
            [DEVWORKSPACE_METADATA_ANNOTATION]: dump({ url: 'devfile-source-location' }),
          },
        } as devfileApi.Devfile;
        const devWorkspace = new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE]: dump(origDevfile),
            },
          })
          .build();
        const workspace = constructWorkspace(devWorkspace);

        const devfile = prepareDevfile(workspace);

        const expectedDevfile = cloneDeep(origDevfile);
        delete expectedDevfile.attributes;

        expect(devfile).toEqual(expectedDevfile);
      });
    });

    test('devWorkspace without DEVWORKSPACE_DEVFILE annotation', () => {
      const expectedDevfile = {
        schemaVersion: '2.2.0',
        metadata: {
          name: 'wksp',
          namespace: 'user-che',
        },
        components: [],
      } as devfileApi.Devfile;
      const devWorkspace = new DevWorkspaceBuilder()
        .withName('wksp')
        .withNamespace('user-che')
        .build();
      const workspace = constructWorkspace(devWorkspace);

      const devfile = prepareDevfile(workspace);
      expect(devfile).toEqual(expectedDevfile);
    });
  });
});

function getComponent(isActive: boolean, workspace: Workspace) {
  return <DevfileEditorTab isActive={isActive} workspace={workspace} />;
}
