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

import common from '@eclipse-che/common';
import { AxiosError } from 'axios';

import * as factoryApi from '@/services/backend-client/factoryApi';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

import OAuthService from '..';

const refreshFactoryOauthTokenSpy = jest.spyOn(factoryApi, 'refreshFactoryOauthToken');

const mockOpenOAuthPage = jest.fn().mockImplementation();
OAuthService.openOAuthPage = mockOpenOAuthPage;

// mute the outputs
console.log = jest.fn();

describe('OAuth service', () => {
  it('should not refresh token if no status section in devworkspace', async () => {
    const devWorkspace = new DevWorkspaceBuilder().build();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).not.toHaveBeenCalled();
  });
  it('should not refresh token if no mainUrl in status', async () => {
    const status = {};
    const devWorkspace = new DevWorkspaceBuilder().withStatus(status).build();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).not.toHaveBeenCalled();
  });
  it('should not refresh token if no projects section in devworkspace', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const devWorkspace = new DevWorkspaceBuilder().withStatus(status).build();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).not.toHaveBeenCalled();
  });

  it('should not refresh token if devworkspace does not have any project', async () => {
    const projects = [{}];
    const status = { mainUrl: 'https://mainUrl' };
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).not.toHaveBeenCalled();
  });

  it('should not refresh token if no git project', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        zip: {
          url: 'project',
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).not.toHaveBeenCalled();
  });

  it('should refresh token', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        git: {
          remotes: {
            origin: 'origin:project',
          },
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    refreshFactoryOauthTokenSpy.mockResolvedValueOnce();

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).toHaveBeenCalledWith('origin:project');
  });

  it('should not redirect to oauth window if an error does not include axios responce', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        git: {
          remotes: {
            origin: 'origin:project',
          },
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    refreshFactoryOauthTokenSpy.mockRejectedValueOnce({
      isAxiosError: false,
      code: '500',
      response: {
        data: {
          message: 'Something unexpected happened.',
        },
      },
    } as AxiosError);

    jest.spyOn(common.helpers.errors, 'includesAxiosResponse').mockImplementation(() => false);

    await OAuthService.refreshTokenIfNeeded(devWorkspace);

    expect(refreshFactoryOauthTokenSpy).toHaveBeenCalledWith('origin:project');
    expect(mockOpenOAuthPage).not.toHaveBeenCalled();
  });

  it('should not redirect to oauth window if status code is not 401', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        git: {
          remotes: {
            origin: 'origin:project',
          },
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    refreshFactoryOauthTokenSpy.mockRejectedValueOnce({
      isAxiosError: false,
      code: '500',
      response: {
        status: 500,
        data: {
          responseData: {
            attributes: {
              oauth_provider: 'git-lab',
              oauth_authentication_url: 'https://git-lub/oauth/url',
            },
          },
        },
      },
    } as AxiosError);

    jest.spyOn(common.helpers.errors, 'includesAxiosResponse').mockImplementation(() => true);

    try {
      await OAuthService.refreshTokenIfNeeded(devWorkspace);
    } catch (e: any) {
      fail('it should not reach here');
    }

    expect(refreshFactoryOauthTokenSpy).toHaveBeenCalledWith('origin:project');
    expect(mockOpenOAuthPage).not.toHaveBeenCalled();
  });

  it('should not redirect to oauth window if error does not provide OAuth response', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        git: {
          remotes: {
            origin: 'origin:project',
          },
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    refreshFactoryOauthTokenSpy.mockRejectedValueOnce({
      isAxiosError: false,
      code: '401',
      response: {
        status: 401,
        data: {
          responseData: {
            attributes: {},
          },
        },
      },
    } as AxiosError);

    jest.spyOn(common.helpers.errors, 'includesAxiosResponse').mockImplementation(() => true);

    try {
      await OAuthService.refreshTokenIfNeeded(devWorkspace);
    } catch (e: any) {
      fail('it should not reach here');
    }

    expect(refreshFactoryOauthTokenSpy).toHaveBeenCalledWith('origin:project');
    expect(mockOpenOAuthPage).not.toHaveBeenCalled();
  });

  it('should redirect to oauth window if error has OAuth response', async () => {
    const status = { mainUrl: 'https://mainUrl' };
    const projects = [
      {
        name: 'project',
        git: {
          remotes: {
            origin: 'origin:project',
          },
        },
      },
    ];
    const devWorkspace = new DevWorkspaceBuilder()
      .withStatus(status)
      .withProjects(projects)
      .build();

    refreshFactoryOauthTokenSpy.mockRejectedValueOnce({
      isAxiosError: false,
      code: '401',
      response: {
        status: 401,
        data: {
          attributes: {
            oauth_provider: 'git-lab',
            oauth_authentication_url: 'https://git-lub/oauth/url',
          },
        },
      },
    } as AxiosError);

    jest.spyOn(common.helpers.errors, 'includesAxiosResponse').mockImplementation(() => true);

    try {
      await OAuthService.refreshTokenIfNeeded(devWorkspace);
    } catch (e: any) {
      expect(e.response.status).toBe(401);
    }

    expect(refreshFactoryOauthTokenSpy).toHaveBeenCalledWith('origin:project');
    expect(mockOpenOAuthPage).toHaveBeenCalled();
  });
});
