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

import axios from 'axios';
import { cheServerPrefix } from './const';

export async function getKubernetesNamespace(): Promise<che.KubernetesNamespace[]> {
  const response = await axios.get(`${cheServerPrefix}/kubernetes/namespace`);

  return response.data;
}

export async function provisionKubernetesNamespace(): Promise<che.KubernetesNamespace> {
  const response = await axios.post(`${cheServerPrefix}/kubernetes/namespace/provision`);

  return response.data;
}
