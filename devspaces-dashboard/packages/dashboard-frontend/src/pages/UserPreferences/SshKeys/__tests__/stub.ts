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

export const sshKey1: api.SshKey = {
  name: 'key-name-1',
  creationTimestamp: undefined,
  keyPub: btoa('key-pub-data-1'),
};

export const sshKey2: api.SshKey = {
  name: 'key-name-2',
  creationTimestamp: undefined,
  keyPub: btoa('key-pub-data-2'),
};
