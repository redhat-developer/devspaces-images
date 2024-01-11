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

import { InfrastructureNamespaceFormGroup } from '@/pages/WorkspaceDetails/OverviewTab/InfrastructureNamespace';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('InfrastructureNamespaceFormGroup', () => {
  test('screenshot', () => {
    const snapshot = createSnapshot('user-namespace');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('namespace is displayed', () => {
    renderComponent('user-namespace');
    expect(screen.queryByText('user-namespace')).not.toBeNull();
  });
});

function getComponent(namespace: string) {
  return <InfrastructureNamespaceFormGroup namespace={namespace} />;
}
