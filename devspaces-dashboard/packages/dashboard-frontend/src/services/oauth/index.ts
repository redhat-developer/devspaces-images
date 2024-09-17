/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import common, { helpers } from '@eclipse-che/common';

import { refreshFactoryOauthToken } from '@/services/backend-client/factoryApi';
import devfileApi from '@/services/devfileApi';
import { OAuthResponse } from '@/store/FactoryResolver';

export class OAuthService {
  static openOAuthPage(authenticationUrl: string, redirectUrl: string): void {
    try {
      const oauthUrlTmp = new window.URL(authenticationUrl);
      window.location.href =
        oauthUrlTmp.toString() + '&redirect_after_login=' + redirectUrl.toString();
    } catch (e) {
      throw new Error(`Failed to open authentication page. ${helpers.errors.getMessage(e)}`);
    }
  }

  static async refreshTokenIfProjectExists(workspace: devfileApi.DevWorkspace): Promise<void> {
    // Find first git project.
    let project = workspace.spec.template.projects?.find(project => !!project.git);
    project = project || workspace.spec.template.starterProjects?.find(project => !!project.git);
    project = project || workspace.spec.template.dependentProjects?.find(project => !!project.git);

    try {
      if (project) {
        await refreshFactoryOauthToken(project.git!.remotes.origin);
      }
    } catch (e) {
      if (!common.helpers.errors.includesAxiosResponse(e)) {
        return;
      }
      const response = e.response;
      if (response.status === 401 && isOAuthResponse(response.data)) {
        // build redirect URL
        const redirectUrl = new URL(
          'dashboard/w',
          window.location.protocol + '//' + window.location.host,
        );
        redirectUrl.searchParams.set(
          'params',
          `{"namespace":"${workspace.metadata.namespace}","workspace":"${workspace.metadata.name}"}`,
        );
        OAuthService.openOAuthPage(
          response.data.attributes.oauth_authentication_url,
          redirectUrl.toString(),
        );
      }
      throw e;
    }
  }
}

export function isOAuthResponse(responseData: unknown): responseData is OAuthResponse {
  if (
    responseData &&
    (responseData as Partial<OAuthResponse>).attributes?.oauth_provider &&
    (responseData as Partial<OAuthResponse>).attributes?.oauth_authentication_url
  ) {
    return true;
  }
  return false;
}
