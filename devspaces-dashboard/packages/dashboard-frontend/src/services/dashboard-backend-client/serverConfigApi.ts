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
import axios from 'axios';
import { prefix } from './const';

/**
 * Returns an array of default plug-ins per editor
 *
 * @returns Promise resolving with the object with includes
 * default plug-ins for the specified editor,
 * default editor and default components
 */
export async function fetchServerConfig(): Promise<api.IServerConfig> {
  const url = `${prefix}/server-config`;
  const response = await axios.get(url);
  return response.data ? response.data : [];
}
