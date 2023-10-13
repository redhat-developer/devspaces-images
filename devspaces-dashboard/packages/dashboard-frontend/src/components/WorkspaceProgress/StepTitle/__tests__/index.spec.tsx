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

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

import { ProgressStepTitle } from '..';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('ProgressStepTitle', () => {
  test('snapshot - non-active step', () => {
    const snapshot = createSnapshot(-1, {});
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step', () => {
    const snapshot = createSnapshot(0, {});
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step failed', () => {
    const snapshot = createSnapshot(0, { isError: true });
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step warning', () => {
    const snapshot = createSnapshot(0, { isWarning: true });
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot - active step has children', () => {
    const snapshot = createSnapshot(0, { hasChildren: true });
    expect(snapshot).toMatchSnapshot();
  });
});

function getComponent(
  distance: -1 | 0 | 1 | undefined,
  {
    hasChildren = false,
    isError = false,
    isWarning = false,
  }: { isError?: boolean; isWarning?: boolean; hasChildren?: boolean },
) {
  return (
    <ProgressStepTitle
      distance={distance}
      hasChildren={hasChildren}
      isError={isError}
      isWarning={isWarning}
    >
      Step 1
    </ProgressStepTitle>
  );
}
