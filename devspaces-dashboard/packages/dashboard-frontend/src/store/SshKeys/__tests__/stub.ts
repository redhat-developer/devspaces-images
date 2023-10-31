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

export const key1: api.SshKey = {
  name: 'key-name-1',
  creationTimestamp: undefined,
  keyPub: 'key-pub-data-1',
};

export const key2: api.SshKey = {
  name: 'key-name-2',
  creationTimestamp: undefined,
  keyPub: 'key-pub-data-2',
};

export const newKey: api.NewSshKey = {
  name: 'key-name-3',
  key: 'key-data-3',
  keyPub: 'key-pub-data-3',
};
