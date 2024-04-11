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

import mockAxios, { AxiosResponse } from 'axios';

import { grabLink } from '@/store/FactoryResolver/helpers';

const mockGet = mockAxios.get as jest.Mock;

describe('grabLink', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({
      data: 'inline:\n  schemaVersion: 2.1.0\n  metadata:\n    name: che-code\n    displayName: VS Code - Open Source',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('list of links is empty', async () => {
    const links = [];
    const link = await grabLink(links, 'self');

    expect(link).toBeUndefined();
  });

  test('link is not found', async () => {
    const links = getLinks();
    const link = await grabLink(links, '.che/my-editor.yaml');

    expect(link).toBeUndefined();
  });

  test('link is found', async () => {
    const links = getLinks();
    const link = await grabLink(links, '.che/che-editor.yaml');

    expect(link).toEqual(
      'inline:\n  schemaVersion: 2.1.0\n  metadata:\n    name: che-code\n    displayName: VS Code - Open Source',
    );
  });

  test('link is found but devfile is not found', async () => {
    mockGet.mockRejectedValueOnce({
      response: {
        headers: {},
        config: {},
        status: 404,
        statusText: 'Not Found',
        data: {},
      } as AxiosResponse,
    });

    const links = getLinks();
    await expect(grabLink(links, '.che/che-editor.yaml')).resolves.toBeUndefined();
  });

  test('link is found but request fails', async () => {
    const response = {
      headers: {},
      config: {},
      status: 500,
      statusText: 'Internal Server Error',
      data: {},
    } as AxiosResponse;
    mockGet.mockRejectedValueOnce({
      response,
    });

    const links = getLinks();
    await expect(grabLink(links, '.che/che-editor.yaml')).rejects.toEqual({ response });
  });

  test('query parameters are encoded', async () => {
    const links = getLinks();
    await grabLink(links, '.che/che-editor.yaml');

    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://che-host/api/scm/resolve?repository=https%3A%2F%2Fgithub.com%2Fusername%2Fweb-nodejs-sample%2Ftree%2Fubi9-devspaces-editor&file=.che%2Fche-editor.yaml',
      expect.anything(),
    );
  });
});

function getLinks() {
  return [
    {
      href: 'https://che-host/api/scm/resolve?repository=https://github.com/username/repo&file=devfile.yaml',
      rel: 'devfile.yaml content',
      method: 'GET',
    },
    {
      href: 'https://che-host/api/scm/resolve?repository=https://github.com/username/web-nodejs-sample/tree/ubi9-devspaces-editor&file=.che/che-editor.yaml',
      rel: '.che/che-editor.yaml content',
      method: 'GET',
    },
    {
      href: 'https://che-host/api/scm/resolve?repository=https://github.com/username/web-nodejs-sample/tree/ubi9-devspaces-editor&file=.che/che-theia-plugins.yaml',
      rel: '.che/che-theia-plugins.yaml content',
      method: 'GET',
    },
    {
      href: 'https://che-host/api/scm/resolve?repository=https://github.com/username/web-nodejs-sample/tree/ubi9-devspaces-editor&file=.vscode/extensions.json',
      rel: '.vscode/extensions.json content',
      method: 'GET',
    },
  ];
}
