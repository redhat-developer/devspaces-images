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

import { V1alpha2DevWorkspaceStatusConditions } from '@devfile/api';

export type ConditionType = V1alpha2DevWorkspaceStatusConditions & {
  status: 'True' | 'False' | 'Unknown';
};

export function isWorkspaceStatusCondition(
  condition: V1alpha2DevWorkspaceStatusConditions,
): condition is ConditionType {
  return (
    (condition as ConditionType).status === 'False' ||
    (condition as ConditionType).status === 'True' ||
    (condition as ConditionType).status === 'Unknown'
  );
}

export function isConditionReady(
  condition: ConditionType,
  prevCondition: ConditionType | undefined,
): boolean {
  return (
    isConditionError(condition, prevCondition) === true ||
    condition.status === 'True' ||
    (condition.status === 'Unknown' && prevCondition?.status === 'True')
  );
}

export function isConditionError(
  condition: ConditionType,
  prevCondition: ConditionType | undefined,
): boolean {
  return (
    (prevCondition?.status === 'False' && condition.status === 'Unknown') ||
    (prevCondition?.status === 'Unknown' &&
      condition.status === 'False' &&
      condition.message === 'Workspace stopped due to error') ||
    condition.reason !== undefined
  );
}

export function scoreConditions(conditions: ConditionType[]): number {
  const typeScore = {
    Started: 1,
    DevWorkspaceResolved: 1,
    StorageReady: 1,
    RoutingReady: 1,
    ServiceAccountReady: 1,
    PullSecretsReady: 1,
    DeploymentReady: 1,
  };

  return conditions.reduce((acc, condition) => {
    if (typeScore[condition.type] !== undefined) {
      return acc + typeScore[condition.type];
    }
    return acc;
  }, 0);
}
