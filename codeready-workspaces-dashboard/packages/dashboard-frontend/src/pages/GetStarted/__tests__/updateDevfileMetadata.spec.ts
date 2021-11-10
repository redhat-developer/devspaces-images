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

import { updateDevfileMetadata } from '../updateDevfileMetadata';
import { safeDump } from 'js-yaml';

describe('Update devfile metadata', () => {
  it('should return a devfile V1 as is', () => {
    const devfile = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: 'wksp-',
      },
    };

    const targetDevfile = updateDevfileMetadata(devfile);

    expect(targetDevfile).toEqual(devfile);
  });

  it('should return a devfile V2 with a custom metadata', () => {
    const attributes = {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': safeDump({
          custom: {},
        }),
      },
    };

    let devfile = getV2Devfile();

    expect(devfile.metadata.attributes).toEqual(undefined);

    devfile = updateDevfileMetadata(devfile);

    expect(devfile.metadata.attributes).toEqual(attributes);
  });

  it('should return a devfile V2 with a sample metadata', () => {
    const metadata = getMetadata();
    const attributes = {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': safeDump({
          sample: {
            registry: metadata.registry,
            displayName: metadata.displayName,
            location: metadata.links?.v2,
          },
        }),
      },
    };

    let devfile = getV2Devfile();

    expect(devfile.metadata.attributes).toEqual(undefined);

    devfile = updateDevfileMetadata(devfile, metadata);

    expect(devfile.metadata.attributes).toEqual(attributes);
  });
});

function getMetadata(): che.DevfileMetaData {
  return {
    registry: 'https://dummy-registry.com/devfile-registry',
    displayName: 'Java Spring Boot',
    description: 'Java stack with OpenJDK 11 and Spring Boot Petclinic demo application',
    tags: ['Java'],
    icon: 'https://dummy-registry.com/devfile-registry/images/springboot.svg',
    links: {
      self: 'https://dummy-registry.com/devfile-registry/devfiles/java-web-spring/devfile.yaml',
      v2: 'https://github.com/dummy-samples/java-spring-petclinic/tree/devfilev2',
    },
  };
}

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
