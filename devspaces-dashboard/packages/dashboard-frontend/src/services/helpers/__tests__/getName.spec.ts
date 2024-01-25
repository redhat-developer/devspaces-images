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

import { generateWorkspaceName, WORKSPACE_NAME_MAX_LENGTH } from '@/services/helpers/generateName';

describe('Get a new workspace name', () => {
  it('returns a workspace name which start from the generateName', () => {
    const generateName = 'project-demo';

    const workspaceName = generateWorkspaceName(generateName);

    expect(workspaceName.startsWith(generateName)).toBeTruthy();
  });

  it('returns a workspace name with 5 char suffix', () => {
    const generateName = 'project-demo';

    const workspaceName = generateWorkspaceName(generateName);

    expect(workspaceName.length).toBe(generateName.length + 5);
  });

  it('returns a workspace name less then WORKSPACE_NAME_MAX_LENGTH symbols', () => {
    const generateName = 'a'.repeat(WORKSPACE_NAME_MAX_LENGTH + 100);

    const workspaceName = generateWorkspaceName(generateName);

    expect(workspaceName.length).toBeLessThan(WORKSPACE_NAME_MAX_LENGTH);
  });
});
