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

import * as k8s from '@kubernetes/client-node';

import { retryableExec } from '@/devworkspaceClient/services/helpers/retryableExec';

export function prepareCustomObjectWatch(kc: k8s.KubeConfig): k8s.Watch {
  const customObjectWatch = new k8s.Watch(kc);
  return {
    watch: (...args: Parameters<typeof customObjectWatch.watch>) =>
      retryableExec(() => customObjectWatch.watch(...args)),
  } as k8s.Watch;
}
