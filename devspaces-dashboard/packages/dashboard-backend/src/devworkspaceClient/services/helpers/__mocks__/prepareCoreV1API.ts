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

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as k8s from '@kubernetes/client-node';
import * as request from 'request';

export function prepareCoreV1API(_kc: k8s.KubeConfig): k8s.Watch {
  const watch = async (..._args: Parameters<k8s.Watch['watch']>) => {
    return {
      body: {},
      destroy: () => {
        /* no-op */
      },
    } as request.Request;
  };
  return {
    watch: (...args: Parameters<k8s.Watch['watch']>) => watch(...args),
  } as k8s.Watch;
}
