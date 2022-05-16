/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { FastifyInstance } from 'fastify';
import { ApplicationInfo, ClusterInfo } from '@eclipse-che/common';
import { baseApiPath } from '../constants/config';
import {
  CLUSTER_CONSOLE_GROUP,
  CLUSTER_CONSOLE_ICON,
  CLUSTER_CONSOLE_TITLE,
  CLUSTER_CONSOLE_URL,
} from '../devworkspace-client/services/cluster-info';
import { getSchema } from '../services/helpers';

const tags = ['Cluster Info'];

export function registerClusterInfoApi(server: FastifyInstance) {
  server.get(`${baseApiPath}/cluster-info`, getSchema({ tags }), async () =>
    buildApplicationInfo(),
  );
}

function buildApplicationInfo(): ClusterInfo {
  const applications: ApplicationInfo[] = [];
  if (CLUSTER_CONSOLE_URL) {
    applications.push({
      icon: CLUSTER_CONSOLE_ICON,
      title: CLUSTER_CONSOLE_TITLE,
      url: CLUSTER_CONSOLE_URL,
      group: CLUSTER_CONSOLE_GROUP,
    });
  }
  return { applications };
}
