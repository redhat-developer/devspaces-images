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

import { helpers } from '@eclipse-che/common';
import { OAuthResponse } from '../../store/FactoryResolver';
import SessionStorageService, { SessionStorageKey } from '../session-storage';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../workspace-client/cheworkspace/cheWorkspaceClient';
import { Workspace } from '../workspace-adapter';

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

  static async refreshTokenIfNeeded(workspace: Workspace): Promise<void> {
    if (
      SessionStorageService.get(SessionStorageKey.AUTHENTICATION_STATUS) !== 'started' &&
      workspace.devfile.projects
    ) {
      SessionStorageService.update(SessionStorageKey.AUTHENTICATION_STATUS, 'started');
      const project = workspace.devfile.projects.find(p => (p.name = workspace.projects[0]));
      if (project && project.git) {
        await WorkspaceClient.restApiClient.refreshFactoryOauthToken(project.git.remotes.origin);
      }
    }
  }

  static setOauthStartedState(): void {
    SessionStorageService.update(SessionStorageKey.AUTHENTICATION_STATUS, 'started');
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
