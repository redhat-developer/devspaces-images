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

import { che } from '@eclipse-che/api';

import getRandomString from '@/services/helpers/random';
import normalizeDevfileV1 from '@/store/FactoryResolver/normalizeDevfileV1';

describe('Normalize Devfile V1', () => {
  it('should not change valid values (generateName, name and project name)', () => {
    const prefix = 'prefix';
    const generateName = prefix + getRandomString(50).toLowerCase();
    const name = prefix + getRandomString(50).toLowerCase();
    const projectName = prefix + getRandomString(50).toLowerCase();

    const devfileLike = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: generateName,
        name: name,
      },
      projects: [
        {
          name: projectName,
          source: {
            location: 'https://github.com/eclipse-che/che-theia.git',
            type: 'github',
          },
        },
      ],
    } as che.workspace.devfile.Devfile;

    const targetDevfile = normalizeDevfileV1(devfileLike, 'ephemeral');

    expect(generateName).toEqual(targetDevfile.metadata?.generateName);

    expect(name).toEqual(targetDevfile.metadata?.name);

    expect(projectName).toEqual(targetDevfile.projects?.[0].name);
  });

  it('should fix invalid values (generateName, name and project name)', () => {
    const prefix = 'prefix';
    const generateName = prefix.toUpperCase() + getRandomString(128);
    const name = prefix.toUpperCase() + getRandomString(128);
    const projectName = prefix.toUpperCase() + getRandomString(128);

    const devfileLike = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: generateName,
        name: name,
      },
      projects: [
        {
          name: projectName,
          source: {
            location: 'https://github.com/eclipse-che/che-theia.git',
            type: 'github',
          },
        },
      ],
    } as che.workspace.devfile.Devfile;

    const targetDevfile = normalizeDevfileV1(devfileLike, 'ephemeral');

    expect(generateName.startsWith('PREFIX')).toBeTruthy();
    expect(generateName).not.toEqual(targetDevfile.metadata?.generateName);

    expect(targetDevfile.metadata?.generateName?.startsWith('prefix')).toBeTruthy();
    expect(targetDevfile.metadata?.generateName?.length).toBeLessThan(63);

    expect(name.startsWith('PREFIX')).toBeTruthy();
    expect(name).not.toEqual(targetDevfile.metadata?.name);

    expect(targetDevfile.metadata?.name?.startsWith('prefix')).toBeTruthy();
    expect(targetDevfile.metadata?.name?.length).toBeLessThan(63);

    expect(projectName.startsWith('PREFIX')).toBeTruthy();
    expect(projectName).not.toEqual(targetDevfile.projects?.[0].name);

    expect(targetDevfile.projects?.[0].name?.startsWith('prefix')).toBeTruthy();
    expect(targetDevfile.projects?.[0].name?.length).toBeLessThan(63);
  });
});
