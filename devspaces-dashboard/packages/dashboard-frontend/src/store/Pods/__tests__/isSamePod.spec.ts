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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { pod1, pod2 } from '@/store/Pods/__tests__/stub';
import isSamePod from '@/store/Pods/isSamePod';

describe('isSamePod', () => {
  it('should compare pods by uid', () => {
    expect(isSamePod(pod1, pod1)).toBeTruthy();
    expect(isSamePod(pod1, pod2)).toBeFalsy();
  });

  it('should compare pods by name and namespace', () => {
    const pod1WithoutUid = { ...pod1 };
    delete pod1WithoutUid.metadata!.uid;
    const pod2WithoutUid = { ...pod2 };
    delete pod2WithoutUid.metadata!.uid;
    expect(isSamePod(pod1WithoutUid, pod1WithoutUid)).toBeTruthy();
    expect(isSamePod(pod1WithoutUid, pod2WithoutUid)).toBeFalsy();
  });
});
