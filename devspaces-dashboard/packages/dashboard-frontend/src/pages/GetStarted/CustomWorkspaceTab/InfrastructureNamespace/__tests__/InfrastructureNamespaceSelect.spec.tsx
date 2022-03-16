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

import React from 'react';
import { RenderResult, render, screen, fireEvent } from '@testing-library/react';
import { InfrastructureNamespaceSelect } from '../InfrastructureNamespaceSelect';

describe('Infrastructure Namespace Select', () => {
  const mockOnSelect = jest.fn();
  const namespaces = getKubernetesNamespace();

  function renderSelect(namespaces: che.KubernetesNamespace[]): RenderResult {
    return render(
      <InfrastructureNamespaceSelect
        fieldId="test-id"
        namespaces={namespaces}
        onSelect={mockOnSelect}
      />,
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have pre-selected value', () => {
    renderSelect(namespaces);

    const selectedOption = screen.getByText('Second Namespace');
    expect(selectedOption).toBeTruthy();
  });

  it('should fire event with selected namespace', () => {
    renderSelect(namespaces);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeTruthy();

    fireEvent.click(toggleButton);

    const firstNamespaceOption = screen.getByText('First Namespace');
    expect(firstNamespaceOption).toBeTruthy();

    fireEvent.click(firstNamespaceOption);
    expect(mockOnSelect).toHaveBeenCalledWith(namespaces[0]);
  });
});

function getKubernetesNamespace(): che.KubernetesNamespace[] {
  return [
    {
      name: 'first-namespace',
      attributes: {
        phase: '',
        default: 'false',
        displayName: 'First Namespace',
      },
    },
    {
      name: 'second-namespace',
      attributes: {
        phase: '',
        default: 'true',
        displayName: 'Second Namespace',
      },
    },
  ];
}
