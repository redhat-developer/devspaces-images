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

import {
  V220DevfileCommandsItemsExecGroup,
  V220DevfileComponentsItemsContainerEndpoints,
} from '@devfile/api';
import devfileApi from '../../../services/devfileApi';
import { DevfileConverter } from '../devfile-converter';

describe('devfile converter', () => {

  it('should convert devfile v2 to devfile v1', () => {
    const converter = new DevfileConverter();
    const convertedDevfileV1 = converter.devfileV2toDevfileV1(petclinicV2 as devfileApi.Devfile);
    expect(convertedDevfileV1).toEqual(expectedDevfileV1);
  });

});

const petclinicV2: devfileApi.DevfileLike =
{
  'projects': [
    {
      'name': 'java-spring-petclinic',
      'git': {
        'remotes': {
          'origin': 'https://github.com/che-samples/java-spring-petclinic.git'
        },
        'checkoutFrom': {
          'revision': 'devfilev2'
        }
      }
    }
  ],
  'schemaVersion': '2.1.0',
  'metadata': {
    'name': 'spring-petclinic',
    'attributes': {
      'dw.metadata.annotations': {
        'che.eclipse.org/devfile-source': 'scm:\n  repo: \'https://github.com/che-samples/java-spring-petclinic.git\'\n  revision: devfilev2\n  fileName: devfile.yaml\n'
      }
    }
  },
  'attributes': {
    'che-theia.eclipse.org/sidecar-policy': 'USE_DEV_CONTAINER'
  },
  'components': [
    {
      'name': 'tools',
      'container': {
        'image': 'quay.io/eclipse/che-java11-maven:next',
        'endpoints': [
          {
            'exposure': V220DevfileComponentsItemsContainerEndpoints.ExposureEnum.None,
            'name': 'debug',
            'protocol': V220DevfileComponentsItemsContainerEndpoints.ProtocolEnum.Tcp,
            'targetPort': 5005
          },
          {
            'exposure': V220DevfileComponentsItemsContainerEndpoints.ExposureEnum.Public,
            'name': '8080-tcp',
            'protocol': V220DevfileComponentsItemsContainerEndpoints.ProtocolEnum.Http,
            'targetPort': 8080
          }
        ],
        'volumeMounts': [
          {
            'name': 'm2',
            'path': '/home/user/.m2'
          }
        ],
        'memoryLimit': '3Gi'
      }
    },
    {
      'name': 'm2',
      'volume': {
        'size': '1G'
      }
    }
  ],
  'commands': [
    {
      'id': 'build',
      'exec': {
        'component': 'tools',
        'workingDir': '${PROJECTS_ROOT}/java-spring-petclinic',
        'commandLine': 'mvn clean install',
        'group': {
          'kind': V220DevfileCommandsItemsExecGroup.KindEnum.Build,
          'isDefault': true
        }
      }
    },
    {
      'id': 'run',
      'exec': {
        'component': 'tools',
        'workingDir': '${PROJECTS_ROOT}/java-spring-petclinic',
        'commandLine': 'java -jar target/*.jar',
        'group': {
          'kind': V220DevfileCommandsItemsExecGroup.KindEnum.Run,
          'isDefault': true
        }
      }
    },
    {
      'id': 'run-debug',
      'exec': {
        'component': 'tools',
        'workingDir': '${PROJECTS_ROOT}/java-spring-petclinic',
        'commandLine': 'java -jar -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 target/*.jar',
        'group': {
          'kind': V220DevfileCommandsItemsExecGroup.KindEnum.Run,
          'isDefault': true
        }
      }
    }
  ]
};

const expectedDevfileV1 =
{
  'apiVersion': '1.0.0',
  'metadata': {
    'generateName': 'spring-petclinic'
  },
  'projects': [
    {
      'name': 'java-spring-petclinic',
      'source': {
        'startPoint': 'devfilev2',
        'location': 'https://github.com/che-samples/java-spring-petclinic.git',
        'type': 'git'
      }
    }
  ],
  'components': [
    {
      'type': 'dockerimage',
      'memoryLimit': '3Gi',
      'alias': 'tools',
      'image': 'quay.io/eclipse/che-java11-maven:next',
      'endpoints': [
        {
          'name': 'debug',
          'port': 5005
        },
        {
          'name': '8080-tcp',
          'port': 8080
        }
      ]
    }
  ],
  'commands': [
    {
      'name': 'build',
      'actions': [
        {
          'command': 'mvn clean install',
          'component': 'tools',
          'workdir': '${PROJECTS_ROOT}/java-spring-petclinic',
          'type': 'exec'
        }
      ]
    },
    {
      'name': 'run',
      'actions': [
        {
          'command': 'java -jar target/*.jar',
          'component': 'tools',
          'workdir': '${PROJECTS_ROOT}/java-spring-petclinic',
          'type': 'exec'
        }
      ]
    },
    {
      'name': 'run-debug',
      'actions': [
        {
          'command': 'java -jar -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 target/*.jar',
          'component': 'tools',
          'workdir': '${PROJECTS_ROOT}/java-spring-petclinic',
          'type': 'exec'
        }
      ]
    }
  ]
};
