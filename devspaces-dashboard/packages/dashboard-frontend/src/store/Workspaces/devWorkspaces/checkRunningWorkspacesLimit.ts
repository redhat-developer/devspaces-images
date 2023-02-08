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

import { RunningWorkspacesExceededError } from '.';
import { AppState } from '../..';
import { selectRunningWorkspacesLimit } from '../../ClusterConfig/selectors';
import { selectRunningDevWorkspacesLimitExceeded } from './selectors';

export function checkRunningWorkspacesLimit(state: AppState) {
  const runningLimitExceeded = selectRunningDevWorkspacesLimitExceeded(state);
  if (runningLimitExceeded === false) {
    return;
  }

  const runningLimit = selectRunningWorkspacesLimit(state);
  throwRunningWorkspacesExceededError(runningLimit);
}

export function throwRunningWorkspacesExceededError(runningLimit: number): never {
  const message = `You can only have ${runningLimit} running workspace${
    runningLimit > 1 ? 's' : ''
  } at a time.`;
  throw new RunningWorkspacesExceededError(message);
}
