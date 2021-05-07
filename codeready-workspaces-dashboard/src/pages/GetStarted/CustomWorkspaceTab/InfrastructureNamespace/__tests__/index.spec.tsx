/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { Provider } from 'react-redux';
import { RenderResult, render, fireEvent, screen } from '@testing-library/react';
import InfrastructureNamespaceFormGroup from '../';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';

describe('Infrastructure Namespace', () => {

  const mockOnChange = jest.fn();

  function renderComponent(namespaces: che.KubernetesNamespace[]): RenderResult {
    const store = new FakeStoreBuilder().withInfrastructureNamespace(namespaces).build();

    return render(
      <Provider store={store}>
        <InfrastructureNamespaceFormGroup
          onChange={mockOnChange}
        />
      </Provider>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render component with one namespace', () => {
    const namespaces = getOneNamespace();

    renderComponent(getOneNamespace());

    const input = screen.getByRole('textbox');
    expect(input).toBeVisible();
    expect(input).toHaveValue(namespaces[0].name);
  });

  it('should render component with several namespaces', () => {
    const namespaces = getThreeNamespaces();

    renderComponent(namespaces);

    // click on toggle button to expand the list of options
    const toggleButton = screen.getByRole('button', { name: namespaces[0].name });
    expect(toggleButton).toBeVisible();
    fireEvent.click(toggleButton);
  });

  it('should allow to expand the list with namespaces', () => {
    const namespaces = getThreeNamespaces();

    renderComponent(namespaces);

    // click on toggle button to expand the list of options
    const toggleButton = screen.getByRole('button', { name: namespaces[0].name });
    fireEvent.click(toggleButton);

    const options = screen.getAllByRole('option');
    expect(options.length).toEqual(namespaces.length);
    expect(options[0].textContent).toEqual(namespaces[0].name);
    expect(options[1].textContent).toEqual(namespaces[1].name);
    expect(options[2].textContent).toEqual(namespaces[2].name);
  });

  it('should handle selecting another infrastructure namespace option', () => {
    const namespaces = getThreeNamespaces();

    renderComponent(namespaces);

    // click on toggle button to expand the list of options
    const toggleButton = screen.getByRole('button', { name: namespaces[0].name });
    fireEvent.click(toggleButton);

    const options = screen.getAllByRole('option');

    // click on second option
    fireEvent.click(options[1]);

    expect(mockOnChange).toHaveBeenCalled();
  });

});

function getOneNamespace(): che.KubernetesNamespace[] {
  return [{
    name: 'dummy-namespace',
    attributes: {
      phase: 'Active'
    }
  }];
}

function getThreeNamespaces(): che.KubernetesNamespace[] {
  return [{
    name: 'dummy-namespace-1',
    attributes: { phase: 'Active' }
  }, {
    name: 'dummy-namespace-2',
    attributes: { phase: 'Active' }
  }, {
    name: 'dummy-namespace-3',
    attributes: { phase: 'Active' }
  }];
}
