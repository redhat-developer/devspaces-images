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

import { FastifyInstance } from 'fastify';
import { ApplicationId, ApplicationInfo, ClusterInfo } from '@eclipse-che/common';
import { baseApiPath } from '../../constants/config';
import { getSchema } from '../../services/helpers';

const tags = ['Cluster Info'];

export function registerClusterInfoRoute(server: FastifyInstance) {
  server.get(`${baseApiPath}/cluster-info`, getSchema({ tags }), async () =>
    buildApplicationInfo(),
  );
}

function buildApplicationInfo(): ClusterInfo {
  const clusterConsoleUrl = process.env['OPENSHIFT_CONSOLE_URL'] || '';
  const clusterConsoleTitle = process.env['OPENSHIFT_CONSOLE_TITLE'] || 'OpenShift console';
  const clusterConsoleIcon =
    process.env['OPENSHIFT_CONSOLE_ICON'] ||
    (clusterConsoleUrl ? clusterConsoleUrl + '/static/assets/redhat.svg' : '');
  const clusterConsoleGroup = process.env['OPENSHIFT_CONSOLE_GROUP'];

  const applications: ApplicationInfo[] = [];
  if (clusterConsoleUrl) {
    applications.push({
      id: ApplicationId.CLUSTER_CONSOLE,
      icon: clusterConsoleIcon,
      title: clusterConsoleTitle,
      url: clusterConsoleUrl,
      group: clusterConsoleGroup,
    });
  }
  return { applications };
}
