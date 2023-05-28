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

import { api } from '@eclipse-che/common';
import { Form } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { GitProviderSelector } from '..';
import getComponentRenderer, {
  screen,
} from '../../../../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnSelect = jest.fn();

describe('Registry Username Input', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('default selected provider', () => {
    renderComponent();

    // the default dropdown value should be 'GitHub'
    const dropdownButton = screen.queryByRole('button', { name: 'GitHub' });
    expect(dropdownButton).toBeTruthy();
  });

  test('available provider options', () => {
    renderComponent();

    // the default dropdown value should be 'GitHub'
    const dropdownButton = screen.getByRole('button', { name: 'GitHub' });
    userEvent.click(dropdownButton);

    expect(screen.queryByRole('menuitem', { name: 'Bitbucket Server' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'GitHub' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'GitLab' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Microsoft Azure DevOps' })).toBeTruthy();
  });

  it('should select a provider', () => {
    renderComponent();

    // the default dropdown value should be 'GitHub'
    const dropdownButton = screen.getByRole('button', { name: 'GitHub' });
    userEvent.click(dropdownButton);

    const bitbucketMenuitem = screen.getByRole('menuitem', { name: 'Bitbucket Server' });

    userEvent.click(bitbucketMenuitem);

    expect(mockOnSelect).toHaveBeenCalledWith('bitbucket-server');
    expect(screen.queryByRole('button', { name: 'Bitbucket Server' })).toBeTruthy();
  });

  it('should handle component update', () => {
    const { reRenderComponent } = renderComponent('bitbucket-server');

    // expect Bitbucket to be selected by default
    expect(screen.queryByRole('button', { name: 'Bitbucket Server' })).toBeTruthy();

    reRenderComponent('gitlab');

    // expect the dropdown button to be updated
    expect(screen.queryByRole('button', { name: 'GitLab' })).toBeTruthy();
  });
});

function getComponent(provider?: api.GitProvider): React.ReactElement {
  return (
    <Form>
      <GitProviderSelector provider={provider} onSelect={mockOnSelect} />
    </Form>
  );
}
