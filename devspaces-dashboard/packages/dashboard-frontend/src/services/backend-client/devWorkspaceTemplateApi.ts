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

import common, { api } from '@eclipse-che/common';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';
import devfileApi from '@/services/devfileApi';

export async function createTemplate(
  template: devfileApi.DevWorkspaceTemplate,
): Promise<devfileApi.DevWorkspaceTemplate> {
  const url = `${dashboardBackendPrefix}/namespace/${template.metadata.namespace}/devworkspacetemplates`;
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().post(url, {
      template,
    });
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to create a new devWorkspaceTemplate. ${common.helpers.errors.getMessage(e)}`,
    );
  }
}

export async function getTemplates(namespace: string): Promise<devfileApi.DevWorkspaceTemplate[]> {
  const url = `${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates`;
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(url);
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to fetch devWorkspaceTemplates. ${common.helpers.errors.getMessage(e)}`,
    );
  }
}

export async function patchTemplate(
  namespace: string,
  templateName: string,
  patch: api.IPatch[],
): Promise<devfileApi.DevWorkspace> {
  const url = `${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${templateName}`;
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().patch(url, patch);
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to update devWorkspaceTemplate '${templateName}'. ${common.helpers.errors.getMessage(
        e,
      )}`,
    );
  }
}
