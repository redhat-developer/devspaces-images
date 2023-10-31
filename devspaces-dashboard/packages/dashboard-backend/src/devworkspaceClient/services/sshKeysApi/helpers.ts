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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

export const SSH_CONFIG = `host *
  IdentityFile /etc/ssh/dwo_ssh_key
  StrictHostKeyChecking = no
`;

export const SSH_SECRET_ANNOTATIONS = {
  'controller.devfile.io/mount-as': 'subpath',
  'controller.devfile.io/mount-path': '/etc/ssh/',
};
export const SSH_SECRET_LABELS = {
  'controller.devfile.io/mount-to-devworkspace': 'true',
  'controller.devfile.io/watch-secret': 'true',
};

const SSH_SECRET_NAME = 'git-ssh-key';

export interface SshKeySecret extends k8s.V1Secret {
  metadata: k8s.V1ObjectMeta & {
    name: typeof SSH_SECRET_NAME;
    annotations: typeof SSH_SECRET_ANNOTATIONS;
    labels: typeof SSH_SECRET_LABELS;
  };
  data: {
    dwo_ssh_key: string;
    'dwo_ssh_key.pub': string;
    ssh_config: string;
  };
}

export function buildLabelSelector(): string {
  return Object.entries(SSH_SECRET_LABELS)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export function isSshKeySecret(secret: k8s.V1Secret): secret is SshKeySecret {
  const name = secret.metadata?.name || '';
  const labels = secret.metadata?.labels || {};
  const annotations = secret.metadata?.annotations || {};

  return (
    name.includes(SSH_SECRET_NAME) === true &&
    labels['controller.devfile.io/mount-to-devworkspace'] === 'true' &&
    labels['controller.devfile.io/watch-secret'] === 'true' &&
    annotations['controller.devfile.io/mount-as'] === 'subpath' &&
    annotations['controller.devfile.io/mount-path'] === '/etc/ssh/'
  );
}

export function fromSecret(secret: k8s.V1Secret): api.SshKey {
  if (!isSshKeySecret(secret)) {
    throw new Error('Secret is not an SSH key.');
  }

  return {
    creationTimestamp: secret.metadata.creationTimestamp,
    name: secret.metadata.name,
    keyPub: secret.data['dwo_ssh_key.pub'],
  };
}

export function toSecret(namespace: string, sshKey: api.NewSshKey): SshKeySecret {
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: SSH_SECRET_NAME,
      namespace,
      labels: SSH_SECRET_LABELS,
      annotations: SSH_SECRET_ANNOTATIONS,
    },
    data: {
      'dwo_ssh_key.pub': sshKey.keyPub,
      dwo_ssh_key: sshKey.key,
      ssh_config: btoa(SSH_CONFIG),
    },
  };
}
