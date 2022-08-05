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

import { dump } from 'js-yaml';
import { findTargetWorkspace } from '../../Steps/findTargetWorkspace';
import { constructWorkspace } from '../../../../../services/workspace-adapter';
import { DevWorkspaceBuilder } from '../../../../../store/__mocks__/devWorkspaceBuilder';
import { CheWorkspaceBuilder } from '../../../../../store/__mocks__/cheWorkspaceBuilder';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import devfileApi from '../../../../../services/devfileApi';

describe('findTargetWorkspace', () => {
  const factoryId = 'url=https://factory-url';
  const policiesCreate = 'peruser';

  it('should ignore Che7 workspace', () => {
    const allWorkspaces = [
      new CheWorkspaceBuilder().withName('my-project').withNamespace('user-che').build(),
    ].map(constructWorkspace);

    const workspace = findTargetWorkspace(allWorkspaces, factoryId, policiesCreate);
    expect(workspace).toBeUndefined();
  });

  describe('with DevWorkspaces', () => {
    it('should ignore workspace without defined annotation', () => {
      const allWorkspaces = [
        new DevWorkspaceBuilder()
          .withName('my-project')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              'custom-annotation': 'value',
            },
          })
          .build(),
      ].map(constructWorkspace);

      const workspace = findTargetWorkspace(allWorkspaces, factoryId, policiesCreate);
      expect(workspace).toBeUndefined();
    });

    describe('with policy "peruser"', () => {
      let devWorkspace1: devfileApi.DevWorkspace;
      let devWorkspace2: devfileApi.DevWorkspace;

      const factorySource1 = {
        factory: {
          params: factoryId,
        },
      };
      const factorySource2 = {
        factory: {
          params: 'url=https://path-to-devfile',
        },
      };
      beforeEach(() => {
        devWorkspace1 = new DevWorkspaceBuilder()
          .withName('project-1')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE_SOURCE]: dump(factorySource1),
            },
          })
          .build();
        devWorkspace2 = new DevWorkspaceBuilder()
          .withName('project-2')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE_SOURCE]: dump(factorySource2),
            },
          })
          .build();
      });

      it('should return workspace with the same factory ID', () => {
        const allWorkspaces = [devWorkspace1, devWorkspace2].map(constructWorkspace);

        const workspace = findTargetWorkspace(allWorkspaces, factoryId, policiesCreate);
        expect(workspace).toBeDefined();
        expect(workspace?.name).toEqual('project-1');
      });
    });

    describe('with policy "perclick"', () => {
      let devWorkspace1: devfileApi.DevWorkspace;
      let devWorkspace2: devfileApi.DevWorkspace;

      const policyPerclick = 'perclick';

      const factorySource1 = {
        factory: {
          params: factoryId,
        },
      };
      const factorySource2 = {
        factory: {
          params: 'url=https://path-to-devfile',
        },
      };

      beforeEach(() => {
        devWorkspace1 = new DevWorkspaceBuilder()
          .withName('project-1')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE_SOURCE]: dump(factorySource1),
            },
          })
          .build();
        devWorkspace2 = new DevWorkspaceBuilder()
          .withName('project-2')
          .withNamespace('user-che')
          .withMetadata({
            annotations: {
              [DEVWORKSPACE_DEVFILE_SOURCE]: dump(factorySource2),
            },
          })
          .build();
      });

      it('should ignore workspace with the same factory ID', () => {
        const allWorkspaces = [devWorkspace1, devWorkspace2].map(constructWorkspace);

        const workspace = findTargetWorkspace(allWorkspaces, factoryId, policyPerclick);
        expect(workspace).toBeUndefined();
      });

      it('should return workspace with the same factory ID and workspace name', () => {
        const allWorkspaces = [devWorkspace1, devWorkspace2].map(constructWorkspace);

        const workspace = findTargetWorkspace(
          allWorkspaces,
          factoryId,
          policyPerclick,
          devWorkspace1.metadata.name,
        );
        expect(workspace).toBeDefined();
        expect(workspace?.name).toEqual(devWorkspace1.metadata.name);
      });
    });
  });
});
