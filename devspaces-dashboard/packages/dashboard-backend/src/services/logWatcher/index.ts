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
import { FastifyInstance } from 'fastify';

import { isCheClusterCustomResource } from '@/devworkspaceClient';
import { prepareCustomObjectWatch } from '@/devworkspaceClient/services/helpers/prepareCustomObjectWatch';
import { getServiceAccountToken } from '@/routes/api/helpers/getServiceAccountToken';
import { KubeConfigProvider } from '@/services/kubeclient/kubeConfigProvider';
import { logger, updateLogLevel } from '@/utils/logger';

const GROUP = 'org.eclipse.che';
const VERSION = 'v2';
const PLURAL = 'checlusters';

export async function watchLogLevel(server: FastifyInstance) {
  const token = getServiceAccountToken();
  const kubeConfigProvider = new KubeConfigProvider();
  const kubeConfig = kubeConfigProvider.getKubeConfig(token);

  watchCR(kubeConfig, server);
}

// Watch for changes to the Che Cluster Custom Resource object
// and update the log level accordingly
export async function watchCR(kubeConfig: k8s.KubeConfig, server: FastifyInstance) {
  const env = getEnv();
  if (env.CHECLUSTER_CR_NAMESPACE === undefined) {
    logger.error(
      'Log level watcher: Environment variable is not defined: $CHECLUSTER_CR_NAMESPACE',
    );
    return;
  }

  const customObjectWatch = prepareCustomObjectWatch(kubeConfig);

  // Watch for changes to the Che Cluster Custom Resource object
  const stream = await customObjectWatch.watch(
    `/apis/${GROUP}/${VERSION}/namespaces/${env.CHECLUSTER_CR_NAMESPACE}/${PLURAL}`,
    { watch: true },
    (type, apiObj) => {
      if (isCheClusterCustomResource(apiObj)) {
        const logLevel = apiObj.spec.components?.dashboard?.logLevel;
        if (logLevel !== undefined) {
          updateLogLevel(logLevel, server);
        }
      }
    },
    err => {
      logger.error(err, 'Log level watcher: Watch failed.');
    },
  );

  stream.on('close', () => {
    logger.error('Log level watcher: Stream closed.');
  });
}

function getEnv(): {
  CHECLUSTER_CR_NAME: string | undefined;
  CHECLUSTER_CR_NAMESPACE: string | undefined;
} {
  return {
    CHECLUSTER_CR_NAME: process.env.CHECLUSTER_CR_NAME,
    CHECLUSTER_CR_NAMESPACE: process.env.CHECLUSTER_CR_NAMESPACE,
  };
}
