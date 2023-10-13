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

import { ConditionType } from '@/components/WorkspaceProgress/utils';

export const conditionChangedTo: {
  [key: string]: [condition: ConditionType, prevCondition: ConditionType | undefined];
} = {
  inProgress1: [
    {
      status: 'False',
      type: 'Started',
    },
    undefined,
  ],
  inProgress2: [
    {
      status: 'False',
      type: 'Started',
    },
    {
      status: 'False',
      type: 'Started',
    },
  ],

  done1: [
    {
      status: 'True',
      type: 'Started',
    },
    {
      status: 'False',
      type: 'Started',
    },
  ],
  done2: [
    {
      status: 'Unknown',
      type: 'Started',
    },
    {
      status: 'True',
      type: 'Started',
    },
  ],

  fail1: [
    {
      status: 'Unknown',
      type: 'Started',
    },
    {
      status: 'False',
      type: 'Started',
    },
  ],
  fail2: [
    {
      status: 'False',
      type: 'Started',
      message: 'Workspace stopped due to error',
    },
    {
      status: 'Unknown',
      type: 'Started',
    },
  ],
  fail3: [
    {
      status: 'True',
      type: 'Started',
      reason: 'Failed',
    },
    undefined,
  ],
};

export const conditionStatusFalse: ConditionType = {
  message: 'Preparing networking',
  status: 'False',
  type: 'RoutingReady',
};
export const conditionStatusTrue: ConditionType = {
  message: 'Networking ready',
  status: 'True',
  type: 'RoutingReady',
};
export const conditionError: ConditionType = {
  status: 'True',
  type: 'FailedStart',
  reason: 'Failure',
  message: 'Something happened',
};
export const conditionStatusUnknown: ConditionType = {
  status: 'Unknown',
  type: 'RoutingReady',
};
