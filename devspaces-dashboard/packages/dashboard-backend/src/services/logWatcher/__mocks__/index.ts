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
import { FastifyInstance } from 'fastify';

export async function watchLogLevel(_server: FastifyInstance): Promise<void> {
  // no-op
}

export async function readCR(_kubeConfig: k8s.KubeConfig, _server: FastifyInstance): Promise<void> {
  // no-op
}

export async function watchCR(
  _kubeConfig: k8s.KubeConfig,
  _server: FastifyInstance,
): Promise<void> {
  // no-op
}
