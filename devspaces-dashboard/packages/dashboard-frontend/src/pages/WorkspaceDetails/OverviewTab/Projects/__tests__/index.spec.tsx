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

import React from 'react';

import { ProjectsFormGroup } from '@/pages/WorkspaceDetails/OverviewTab/Projects';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('ProjectsFormGroup', () => {
  test('screenshot', () => {
    const snapshot = createSnapshot(['project1', 'project2']);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('all projects are displayed', () => {
    renderComponent(['project1', 'project2']);
    expect(screen.queryByText('project1, project2')).not.toBeNull();
  });
});

function getComponent(projects: string[]) {
  return <ProjectsFormGroup projects={projects} />;
}
