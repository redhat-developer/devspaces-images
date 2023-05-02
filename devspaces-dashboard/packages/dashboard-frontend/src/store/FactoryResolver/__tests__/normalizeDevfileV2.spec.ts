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

import normalizeDevfileV2 from '../normalizeDevfileV2';
import devfileApi from '../../../services/devfileApi';
import { FactoryResolver } from '../../../services/helpers/types';
import { V221DevfileComponents } from '@devfile/api';

describe('Normalize Devfile V2', () => {
  let defaultComponents: V221DevfileComponents[];

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
    const devfileLike = {
      schemaVersion: '2.1.0',
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
    } as devfileApi.DevfileLike;

    const targetDevfile = normalizeDevfileV2(
      devfileLike,
      {} as FactoryResolver,
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
        components: devfileLike.components,
      }),
    );
  });

  it('should not apply defaultComponents if parent exist', () => {
    const devfileLike = {
      schemaVersion: '2.1.0',
      metadata: {
        generateName: 'empty',
      },
      parent: {
        id: 'java-maven',
        registryUrl: 'https://registry.devfile.io/',
        version: '1.2.0',
      },
      components: [],
    } as devfileApi.DevfileLike;

    const targetDevfile = normalizeDevfileV2(
      devfileLike,
      {} as FactoryResolver,
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
        components: devfileLike.components,
      }),
    );
  });

  it('should apply defaultComponents', () => {
    const devfileLike = {
      schemaVersion: '2.1.0',
      metadata: {
        generateName: 'empty',
      },
      components: [],
    } as devfileApi.DevfileLike;

    const targetDevfile = normalizeDevfileV2(
      devfileLike,
      {} as FactoryResolver,
      'http://dummy-registry/devfiles/empty.yaml',
      defaultComponents,
      'che',
      {},
    );

    expect(targetDevfile).not.toEqual(
      expect.objectContaining({
        components: devfileLike.components,
      }),
    );
    expect(targetDevfile).toEqual(
      expect.objectContaining({
        components: defaultComponents,
      }),
    );
  });

  it('should apply the custom image from factory params', () => {
    const devfileLike = {
      schemaVersion: '2.1.0',
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
    } as devfileApi.DevfileLike;
    const factoryParams = {
      image: 'quay.io/devfile/universal-developer-image:test',
    };

    const targetDevfile = normalizeDevfileV2(
      devfileLike,
      {} as FactoryResolver,
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
    const devfileLike = {
      schemaVersion: '2.1.0',
      metadata: {
        generateName: 'empty',
      },
    } as devfileApi.DevfileLike;
    const factoryParams = {
      image: 'quay.io/devfile/universal-developer-image:test',
    };

    const targetDevfile = normalizeDevfileV2(
      devfileLike,
      {} as FactoryResolver,
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
