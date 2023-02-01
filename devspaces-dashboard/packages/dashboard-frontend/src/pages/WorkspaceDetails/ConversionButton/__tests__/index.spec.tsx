/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
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
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import renderer, { ReactTestRendererJSON } from 'react-test-renderer';
import WorkspaceConversionButton from '..';
import userEvent from '@testing-library/user-event';

const mockOnConvert = jest.fn();

describe('WorkspaceConversionButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('render', () => {
    const component = getComponent();
    const snapshot = createSnapshot(component);
    expect(snapshot).toMatchSnapshot();
  });

  it('should emit cleanupError on conversion start', async () => {
    const component = getComponent();
    renderComponent(component);

    const convertButton = screen.getByRole('button', { name: 'Convert' });
    userEvent.click(convertButton);

    await waitFor(() => expect(mockOnConvert).toBeCalled());
  });

  function getComponent(): React.ReactElement {
    return <WorkspaceConversionButton onConvert={mockOnConvert} />;
  }

  function renderComponent(component: React.ReactElement): RenderResult {
    return render(component);
  }

  function createSnapshot(
    component: React.ReactElement,
  ): null | ReactTestRendererJSON | ReactTestRendererJSON[] {
    return renderer.create(component).toJSON();
  }
});
