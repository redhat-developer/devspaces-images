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

import { ConditionType } from './StartingSteps/WorkspaceConditions';

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
