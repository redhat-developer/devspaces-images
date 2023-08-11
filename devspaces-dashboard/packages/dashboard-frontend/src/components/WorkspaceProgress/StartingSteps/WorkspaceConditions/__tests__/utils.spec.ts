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

import { isConditionReady, isConditionError } from '../../../utils';
import {
  conditionChangedTo,
  conditionError,
  conditionStatusFalse,
  conditionStatusTrue,
  conditionStatusUnknown,
} from './fixtures';

describe('utils', () => {
  test('isReady', () => {
    expect(isConditionReady(...conditionChangedTo.inProgress1)).toEqual(false);
    expect(isConditionReady(...conditionChangedTo.inProgress2)).toEqual(false);

    expect(isConditionReady(...conditionChangedTo.done1)).toEqual(true);
    expect(isConditionReady(...conditionChangedTo.done2)).toEqual(true);

    expect(isConditionReady(...conditionChangedTo.fail1)).toEqual(true);
    expect(isConditionReady(...conditionChangedTo.fail2)).toEqual(true);
    expect(isConditionReady(...conditionChangedTo.fail3)).toEqual(true);

    expect(isConditionReady(conditionStatusFalse, undefined)).toEqual(false);
    expect(isConditionReady(conditionStatusTrue, undefined)).toEqual(true);
    expect(isConditionReady(conditionStatusUnknown, undefined)).toEqual(false);
    expect(isConditionReady(conditionError, undefined)).toEqual(true);
  });

  test('isError', () => {
    expect(isConditionError(...conditionChangedTo.inProgress1)).toEqual(false);
    expect(isConditionError(...conditionChangedTo.inProgress2)).toEqual(false);

    expect(isConditionError(...conditionChangedTo.done1)).toEqual(false);
    expect(isConditionError(...conditionChangedTo.done2)).toEqual(false);

    expect(isConditionError(...conditionChangedTo.fail1)).toEqual(true);
    expect(isConditionError(...conditionChangedTo.fail2)).toEqual(true);
    expect(isConditionError(...conditionChangedTo.fail3)).toEqual(true);

    expect(isConditionError(conditionStatusFalse, undefined)).toEqual(false);
    expect(isConditionError(conditionStatusTrue, undefined)).toEqual(false);
    expect(isConditionError(conditionStatusUnknown, undefined)).toEqual(false);
    expect(isConditionError(conditionError, undefined)).toEqual(true);
  });
});
