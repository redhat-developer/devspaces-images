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
import { ProgressStepTitleIcon } from '..';
import getComponentRenderer from '../../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('StepTitleIcon', () => {
  test('error', () => {
    const snapshot = createSnapshot(0, true, false);
    expect(snapshot).toMatchSnapshot();
  });

  test('warning', () => {
    const snapshot = createSnapshot(0, false, true);
    expect(snapshot).toMatchSnapshot();
  });

  test('step is not started yet', () => {
    const snapshot = createSnapshot(-1, false, false);
    expect(snapshot).toMatchSnapshot();
  });

  test('step is in-progress', () => {
    const snapshot = createSnapshot(0, false, false);
    expect(snapshot).toMatchSnapshot();
  });

  test('step is done', () => {
    const snapshot = createSnapshot(1, false, false);
    expect(snapshot).toMatchSnapshot();
  });
});

function getComponent(distance: -1 | 0 | 1 | undefined, isError: boolean, isWarning: boolean) {
  return <ProgressStepTitleIcon distance={distance} isError={isError} isWarning={isWarning} />;
}
