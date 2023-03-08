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

import common, { helpers } from '@eclipse-che/common';
import { OAuthResponse } from '../../store/FactoryResolver';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../workspace-client/cheworkspace/cheWorkspaceClient';
import devfileApi from '../devfileApi';

const WorkspaceClient = container.get(CheWorkspaceClient);

export default class OAuthService {
  static openOAuthPage(authenticationUrl: string, redirectUrl: string): void {
    try {
      const oauthUrlTmp = new window.URL(authenticationUrl);
      window.location.href =
        oauthUrlTmp.toString() + '&redirect_after_login=' + redirectUrl.toString();
    } catch (e) {
      throw new Error(`Failed to open authentication page. ${helpers.errors.getMessage(e)}`);
    }
  }

  static async refreshTokenIfNeeded(workspace: devfileApi.DevWorkspace): Promise<void> {
    // if workspace is not created yet, do not refresh token
    if (!workspace.status || !workspace.status.mainUrl) {
      return;
    }
    if (!workspace.spec.template.projects) {
      return;
    }

    const project = workspace.spec.template.projects[0];
    if (!project || !project.git) {
      return;
    }

    try {
      await WorkspaceClient.restApiClient.refreshFactoryOauthToken(project.git.remotes.origin);
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
    }
  }
}

export function isOAuthResponse(responseData: any): responseData is OAuthResponse {
  if (
    responseData?.attributes?.oauth_provider &&
    responseData?.attributes?.oauth_authentication_url
  ) {
    return true;
  }
  return false;
}
