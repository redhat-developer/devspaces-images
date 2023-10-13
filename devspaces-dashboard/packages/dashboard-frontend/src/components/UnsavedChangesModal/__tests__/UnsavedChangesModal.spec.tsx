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

import { fireEvent, render, screen } from '@testing-library/react';
import { createHashHistory } from 'history';
import React from 'react';

import UnsavedChangesModal from '..';

describe('Unsaved Changes modal window', () => {
  const hasUnsavedChanges = jest.fn();
  const onDiscardChanges = jest.fn();

  const history = createHashHistory();

  const component = (
    <UnsavedChangesModal
      history={history}
      hasUnsavedChanges={hasUnsavedChanges}
      onDiscardChanges={onDiscardChanges}
      isOpenInitState={true}
    />
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should inform users about unsaved changes', () => {
    const message =
      'You have unsaved changes. You may go ahead and discard all changes, or close this window and save them.';

    render(component);

    expect(screen.queryByText(message, { exact: false })).toBeTruthy();
  });

  it('should fire Discard Changes event', () => {
    render(component);

    const logoutButton = screen.getByRole('button', { name: 'Discard Changes' });
    fireEvent.click(logoutButton);
    jest.runOnlyPendingTimers();

    expect(onDiscardChanges).toHaveBeenCalledWith('/');
  });
});
