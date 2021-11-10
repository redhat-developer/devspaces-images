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

import { getDevfile } from '../../FactoryResolver/getDevfile';
import { FactoryResolverBuilder } from '../../__mocks__/factoryResolverBuilder';
import { safeDump } from 'js-yaml';

describe('Get a devfile from factory resolver object', () => {
  const location = 'http://dummy/test.com/project-demo';

  it('should return a devfile V1 as is', () => {
    const devfile = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: 'wksp-',
      },
    };
    const factoryResolver = new FactoryResolverBuilder().withDevfile(devfile).build();

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile).toEqual(devfile);
  });

  it('should return a devfile V2 as is', () => {
    const devfile = getV2Devfile();
    const factoryResolver = new FactoryResolverBuilder().withDevfile(devfile).build();

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile).toEqual(devfile);
  });

  it('should return a devfile V2 with a default project', () => {
    const devfile = getV2Devfile();
    const factoryResolver = new FactoryResolverBuilder()
      .withDevfile(devfile)
      .withScmInfo({
        clone_url: location,
        scm_provider: 'github',
      })
      .build();

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile).toEqual(
      expect.objectContaining({
        projects: [
          {
            git: {
              remotes: {
                origin: 'http://dummy/test.com/project-demo',
              },
            },
            name: 'project-demo',
          },
        ],
      }),
    );
  });

  it('should return a devfile V2 with a scm meta with a source', () => {
    const devfile = getV2Devfile();
    const factoryResolver = new FactoryResolverBuilder()
      .withDevfile(devfile)
      .withSource('devfile.yaml')
      .withScmInfo({
        clone_url: location,
        scm_provider: 'github',
      })
      .build();
    const attributes = {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': safeDump({
          scm: {
            repo: factoryResolver?.scm_info?.clone_url,
            fileName: factoryResolver?.source,
          },
        }),
      },
    };

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile.metadata.attributes).toEqual(attributes);
  });

  it('should return a devfile V2 with a scm meta with a source and revision', () => {
    const devfile = getV2Devfile();
    const factoryResolver = new FactoryResolverBuilder()
      .withDevfile(devfile)
      .withSource('devfile.yaml')
      .withScmInfo({
        clone_url: location,
        scm_provider: 'github',
        branch: 'devfile2',
      })
      .build();
    const attributes = {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': safeDump({
          scm: {
            repo: factoryResolver?.scm_info?.clone_url,
            revision: factoryResolver?.scm_info?.branch,
            fileName: factoryResolver?.source,
          },
        }),
      },
    };

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile.metadata.attributes).toEqual(attributes);
  });

  it('should return a devfile V2 with a scm meta with an URL', () => {
    const devfile = getV2Devfile();
    const factoryResolver = new FactoryResolverBuilder().withDevfile(devfile).build();
    const attributes = {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': safeDump({
          url: { location },
        }),
      },
    };

    const targetDevfile = getDevfile(factoryResolver, location);

    expect(targetDevfile.metadata.attributes).toEqual(attributes);
  });
});

function getV2Devfile(): api.che.workspace.devfile.Devfile {
  return {
    schemaVersion: '2.0.0',
    metadata: {
      name: 'spring-petclinic',
    },
    components: [
      {
        name: 'maven',
        container: {
          image: 'quay.io/eclipse/che-java8-maven:nightly',
          volumeMounts: [
            {
              name: 'mavenrepo',
              path: '/root/.m2',
            },
          ],
          env: [
            {
              name: 'ENV_VAR',
              value: 'value',
            },
          ],
          memoryLimit: '1536M',
        },
      },
      {
        name: 'mavenrepo',
        volume: {},
      },
    ],
  };
}
