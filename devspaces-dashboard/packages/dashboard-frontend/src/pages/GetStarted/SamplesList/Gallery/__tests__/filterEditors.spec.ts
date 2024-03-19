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

import { PluginEditor } from '@/pages/GetStarted/SamplesList/Gallery';
import {
  filterMostPrioritized,
  sortByPriority,
} from '@/pages/GetStarted/SamplesList/Gallery/filterEditors';

describe('Filter Editors', () => {
  let editors: PluginEditor[];

  beforeEach(() => {
    editors = [
      {
        id: 'che-incubator/che-code/insiders',
        description:
          'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
        displayName: 'VS Code - Open Source',
        links: {
          devfile: '/v3/plugins/che-incubator/che-code/insiders/devfile.yaml',
        },
        name: 'che-code',
        publisher: 'che-incubator',
        type: 'Che Editor',
        version: 'insiders',
        icon: '/v3/images/vscode.svg',
        isDefault: true,
      },
      {
        id: 'che-incubator/che-code/latest',
        description: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che',
        displayName: 'VS Code - Open Source',
        links: {
          devfile: '/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
        },
        name: 'che-code',
        publisher: 'che-incubator',
        type: 'Che Editor',
        version: 'latest',
        icon: '/v3/images/vscode.svg',
        isDefault: false,
      },
      {
        id: 'che-incubator/che-idea/latest',
        description: 'JetBrains IntelliJ IDEA Community IDE for Eclipse Che',
        displayName: 'IntelliJ IDEA Community',
        links: {
          devfile: '/v3/plugins/che-incubator/che-idea/latest/devfile.yaml',
        },
        name: 'che-idea',
        publisher: 'che-incubator',
        type: 'Che Editor',
        version: 'latest',
        icon: '/v3/images/intllij-idea.svg',
        isDefault: false,
      },
      {
        id: 'che-incubator/che-idea/next',
        description: 'JetBrains IntelliJ IDEA Community IDE for Eclipse Che - next',
        displayName: 'IntelliJ IDEA Community',
        links: {
          devfile: '/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
        },
        name: 'che-idea',
        publisher: 'che-incubator',
        type: 'Che Editor',
        version: 'next',
        icon: '/v3/images/intllij-idea.svg',
        isDefault: false,
      },
    ];
  });

  it('should sort editors by priority', () => {
    const sortedEditors = sortByPriority(editors);
    expect(sortedEditors).toEqual([
      expect.objectContaining({
        id: 'che-incubator/che-code/insiders',
      }),
      expect.objectContaining({
        id: 'che-incubator/che-code/latest',
      }),
      expect.objectContaining({
        id: 'che-incubator/che-idea/next',
      }),
      expect.objectContaining({
        id: 'che-incubator/che-idea/latest',
      }),
    ]);
  });

  it('should filter editors to leave the first occurrence of each editor name', () => {
    const sortedEditors = sortByPriority(editors);
    const filteredEditors = filterMostPrioritized(sortedEditors);

    expect(filteredEditors).toEqual([
      expect.objectContaining({
        id: 'che-incubator/che-code/insiders',
      }),
      expect.objectContaining({
        id: 'che-incubator/che-idea/next',
      }),
    ]);
  });
});
