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
import { ProgressStepTitle } from '..';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('ProgressStepTitle', () => {
  test('snapshot - non-active step', () => {
    const snapshot = createSnapshot(-1, false, false);
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step', () => {
    const snapshot = createSnapshot(0, false, false);
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step failed', () => {
    const snapshot = createSnapshot(0, true, false);
    expect(snapshot).toMatchSnapshot();
  });
});

function getComponent(distance: -1 | 0 | 1 | undefined, isError: boolean, isWarning: boolean) {
  return (
    <ProgressStepTitle distance={distance} isError={isError} isWarning={isWarning}>
      Step 1
    </ProgressStepTitle>
  );
}
