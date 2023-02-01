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

import { V1alpha2DevWorkspace } from '@devfile/api';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '../../../../../../../services/devfileApi/devWorkspace/spec/template';
import { generateSuffix } from '../../../../../../../services/helpers/generateName';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceResources } from '../../../../../../../store/DevfileRegistries';
import prepareResources from '../prepareResources';

const suffix = '-1234';
jest.mock('../../../../../../../services/helpers/generateName.ts');
(generateSuffix as jest.Mock).mockImplementation(() => suffix);

describe('FactoryLoaderContainer/prepareResources', () => {
  const factoryId = 'url=https://factory-location';
  let resources: DevWorkspaceResources;
  const devWorkspaceName = 'project';
  const devWorkspaceTemplateName = 'editor-plugin';

  beforeEach(() => {
    resources = [
      {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspace',
        metadata: {
          name: devWorkspaceName,
          labels: {},
          namespace: 'user-che',
          uid: '',
        },
        spec: {
          contributions: [
            {
              name: devWorkspaceTemplateName,
              kubernetes: {
                name: devWorkspaceTemplateName,
                namespace: 'user-che',
              },
            },
          ],
          started: false,
          template: {
            components: [],
          },
        },
      },
      {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspaceTemplate',
        metadata: {
          annotations: {},
          name: devWorkspaceTemplateName,
          namespace: 'user-che',
        },
      },
    ];
  });

  test('the DEVWORKSPACE_DEVFILE_SOURCE annotation', () => {
    const result = prepareResources(resources, factoryId, undefined, false);
    expect(result[0].metadata.annotations?.[DEVWORKSPACE_DEVFILE_SOURCE]).toBeDefined();
    expect(result[0].metadata.annotations?.[DEVWORKSPACE_DEVFILE_SOURCE]).toContain(factoryId);
  });

  test('custom DEVWORKSPACE_STORAGE_TYPE value', () => {
    const result = prepareResources(resources, factoryId, 'ephemeral', false);
    expect((result[0].spec.template.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE_ATTR]).toEqual(
      'ephemeral',
    );
  });

  describe('DevWorkspace name', () => {
    it('should generate a new name #1', () => {
      const generateName = 'wksp-';

      resources[0].metadata.generateName = generateName;
      delete (resources[0] as V1alpha2DevWorkspace).metadata?.name;

      const result = prepareResources(resources, factoryId, 'ephemeral', true);

      // DevWorkspaceTemplate
      expect(result[1].metadata.name).toEqual(devWorkspaceTemplateName + suffix);

      // DevWorkspace
      expect(result[0].metadata.generateName).toBeUndefined();
      expect(result[0].metadata.name).toEqual(generateName + suffix);
      expect(result[0].spec.contributions).toEqual(
        expect.arrayContaining([
          {
            name: devWorkspaceTemplateName + suffix,
            kubernetes: {
              name: devWorkspaceTemplateName + suffix,
              namespace: 'user-che',
            },
          },
        ]),
      );
    });

    it('should generate a new name #2', () => {
      const generateName = 'wksp-';

      resources[0].metadata.generateName = generateName;
      delete (resources[0] as V1alpha2DevWorkspace).metadata?.name;

      const result = prepareResources(resources, factoryId, 'ephemeral', false);

      // DevWorkspaceTemplate
      expect(result[1].metadata.name).toEqual(devWorkspaceTemplateName + suffix);

      // DevWorkspace
      expect(result[0].metadata.generateName).toBeUndefined();
      expect(result[0].metadata.name).toEqual(generateName + suffix);
      expect(result[0].spec.contributions).toEqual(
        expect.arrayContaining([
          {
            name: devWorkspaceTemplateName + suffix,
            kubernetes: {
              name: devWorkspaceTemplateName + suffix,
              namespace: 'user-che',
            },
          },
        ]),
      );
    });

    it('should not change the name', () => {
      const result = prepareResources(resources, factoryId, 'ephemeral', false);

      // DevWorkspaceTemplate
      expect(result[1].metadata.name).toEqual(devWorkspaceTemplateName);

      // DevWorkspace
      expect(result[0].metadata.generateName).toBeUndefined();
      expect(result[0].metadata.name).toEqual(devWorkspaceName);
      expect(result[0].spec.contributions).toEqual(
        expect.arrayContaining([
          {
            name: devWorkspaceTemplateName,
            kubernetes: {
              name: devWorkspaceTemplateName,
              namespace: 'user-che',
            },
          },
        ]),
      );
    });

    it('should append a suffix to the name', () => {
      const result = prepareResources(resources, factoryId, 'ephemeral', true);

      // DevWorkspaceTemplate
      expect(result[1].metadata.name).toEqual(devWorkspaceTemplateName + suffix);

      // DevWorkspace
      expect(result[0].metadata.generateName).toBeUndefined();
      expect(result[0].metadata.name).toEqual(devWorkspaceName + suffix);
      expect(result[0].spec.contributions).toEqual(
        expect.arrayContaining([
          {
            name: devWorkspaceTemplateName + suffix,
            kubernetes: {
              name: devWorkspaceTemplateName + suffix,
              namespace: 'user-che',
            },
          },
        ]),
      );
    });
  });
});
