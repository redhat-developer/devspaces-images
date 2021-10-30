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

import axios from 'axios';
import common from '@eclipse-che/common';
import devfileApi from '../devfileApi';
import { prefix } from './const';

export async function createTemplate(template: devfileApi.DevWorkspaceTemplate): Promise<devfileApi.DevWorkspaceTemplate> {
  const url = `${prefix}/namespace/${template.metadata.namespace}/devworkspacetemplates`;
  try {
    const response = await axios.post(url, { template });
    return response.data;
  } catch (e) {
    throw `Failed to create a new DevWorkspaceTemplates. ${common.helpers.errors.getMessage(e)}`;
  }
}
