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

import { V230Devfile, V230DevfileComponents } from '@devfile/api';

import { FactoryResolver } from '@/services/helpers/types';
import { che } from '@/services/models';
import { buildDevfileV2, normalizeDevfile } from '@/store/FactoryResolver/helpers';

describe('buildDevfileV2', () => {
  let devfileV1: che.api.workspace.devfile.Devfile;

  beforeEach(() => {
    devfileV1 = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: 'empty',
      },
      projects: [
        {
          name: 'my-project',
          source: {
            location: 'https://github.com/my/project.git',
            type: 'github',
          },
        },
      ],
    };
  });

  it('should return a devfile with the correct schemaVersion', () => {
    const devfile = buildDevfileV2(devfileV1);

    expect(devfile.schemaVersion).toEqual('2.2.2');
  });

  it('should return a devfile with the correct metadata', () => {
    const devfile = buildDevfileV2(devfileV1);

    expect(devfile.metadata).toStrictEqual(devfile.metadata);
  });

  it('should return a devfile with the correct projects', () => {
    const devfile = buildDevfileV2(devfileV1);

    expect(devfile.projects).toStrictEqual([
      {
        attributes: {},
        git: {
          remotes: {
            origin: 'https://github.com/my/project.git',
          },
        },
        name: 'my-project',
      },
    ]);
  });
});

describe('Normalize Devfile V2', () => {
  let defaultComponents: V230DevfileComponents[];

  beforeEach(() => {
    defaultComponents = [
      {
        container: {
          image: 'quay.io/devfile/universal-developer-image:latest',
        },
        name: 'universal-developer-image',
      },
    ];
  });

  it('should not apply defaultComponents if components exist', () => {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        generateName: 'empty',
      },
      components: [
        {
          container: {
            image: 'quay.io/devfile/custom-developer-image:custom',
          },
          name: 'custom-image',
        },
      ],
    } as V230Devfile;

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      {},
    );

    expect(targetDevfile).not.toEqual(
      expect.objectContaining({
        components: defaultComponents,
      }),
    );
    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: devfile.components,
      }),
    );
  });

  it('should not apply defaultComponents if parent exist', () => {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        generateName: 'empty',
      },
      parent: {
        id: 'java-maven',
        registryUrl: 'https://registry.devfile.io/',
        version: '1.2.0',
      },
      components: [],
    } as V230Devfile;

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      {},
    );

    expect(targetDevfile).not.toEqual(
      expect.objectContaining({
        components: defaultComponents,
      }),
    );
    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: devfile.components,
      }),
    );
  });

  it('should apply metadata name and namespace', () => {
    const devfile = {
      schemaVersion: '2.2.2',
    } as V230Devfile;

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      [],
      'che',
      {},
    );

    expect(targetDevfile.metadata.name).toEqual(expect.stringContaining('empty-yaml'));
    expect(targetDevfile.metadata.namespace).toEqual(expect.stringContaining('che'));
  });

  it('should apply defaultComponents', () => {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        generateName: 'empty',
      },
      components: [],
    } as V230Devfile;

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      {},
    );

    expect(targetDevfile).not.toEqual(
      expect.objectContaining({
        components: devfile.components,
      }),
    );
    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: defaultComponents,
      }),
    );
  });

  it('should apply the custom image from factory params', () => {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        generateName: 'empty',
      },
      components: [
        {
          container: {
            image: 'quay.io/devfile/custom-developer-image:custom',
          },
          name: 'developer-image',
        },
      ],
    } as V230Devfile;
    const factoryParams = {
      image: 'quay.io/devfile/universal-developer-image:test',
    };

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      factoryParams,
    );

    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: [
          {
            container: {
              image: 'quay.io/devfile/universal-developer-image:test',
            },
            name: 'developer-image',
          },
        ],
      }),
    );
  });

  it('should apply defaultComponents and then the custom image from factory params', () => {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        generateName: 'empty',
      },
    } as V230Devfile;
    const factoryParams = {
      image: 'quay.io/devfile/universal-developer-image:test',
    };

    const targetDevfile = normalizeDevfile(
      {
        devfile,
      } as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      factoryParams,
    );

    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: [
          {
            container: {
              image: 'quay.io/devfile/universal-developer-image:test',
            },
            name: 'universal-developer-image',
          },
        ],
      }),
    );
  });
});
