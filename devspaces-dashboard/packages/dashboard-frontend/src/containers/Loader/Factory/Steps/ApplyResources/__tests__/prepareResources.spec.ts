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

import { DEVWORKSPACE_STORAGE_TYPE } from '../../../../../../services/devfileApi/devWorkspace/spec';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceResources } from '../../../../../../store/DevfileRegistries';
import { prepareResources } from '../../../Steps/ApplyResources/prepareResources';

describe('FactoryLoaderContainer/prepareResources', () => {
  const factoryId = 'url=https://factory-location';
  const resources: DevWorkspaceResources = [
    {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'project',
        labels: {},
        namespace: 'user-che',
        uid: '',
      },
      spec: {
        started: false,
        template: {},
      },
    },
    {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspaceTemplate',
      metadata: {
        annotations: {},
        name: 'plugin',
        namespace: 'user-che',
      },
    },
  ];

  test('the DEVWORKSPACE_DEVFILE_SOURCE annotation', () => {
    const result = prepareResources(resources, factoryId, undefined);
    expect(result[0].metadata.annotations?.[DEVWORKSPACE_DEVFILE_SOURCE]).toBeDefined();
    expect(result[0].metadata.annotations?.[DEVWORKSPACE_DEVFILE_SOURCE]).toContain(factoryId);
  });

  test('custom DEVWORKSPACE_STORAGE_TYPE value', () => {
    const result = prepareResources(resources, factoryId, 'ephemeral');
    expect((result[0].spec.template.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE]).toEqual(
      'ephemeral',
    );
  });
});
