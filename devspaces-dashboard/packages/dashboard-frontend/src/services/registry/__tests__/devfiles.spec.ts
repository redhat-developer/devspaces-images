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

import common from '@eclipse-che/common';

import { che } from '@/services/models';
import {
  fetchRegistryMetadata,
  resolveLinks,
  resolveTags,
  updateObjectLinks,
} from '@/services/registry/devfiles';
import SessionStorageService, { SessionStorageKey } from '@/services/session-storage';

const mockFetchData = jest.fn();
jest.mock('@/services/registry/fetchData', () => {
  return {
    fetchData: async (href: string) => {
      return mockFetchData(href);
    },
  };
});

const mockFetchRemoteData = jest.fn();
jest.mock('@/services/backend-client/dataResolverApi', () => {
  return {
    getDataResolver: async (href: string) => {
      return mockFetchRemoteData(href);
    },
  };
});
console.error = jest.fn();
console.warn = jest.fn();

describe('fetch registry metadata', () => {
  const mockSessionStorageServiceGet = jest.fn();
  const mockSessionStorageServiceUpdate = jest.fn();
  const mockDateNow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    SessionStorageService.update = mockSessionStorageServiceUpdate;
    SessionStorageService.get = mockSessionStorageServiceGet;
    Date.now = mockDateNow;
  });

  describe('internal registry', () => {
    const baseUrl = 'http://this.is.my.base.url';

    it('should fetch registry metadata', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: '/devfiles/java-maven/1.2.0',
        },
      } as che.DevfileMetaData;
      mockFetchData.mockResolvedValue([metadata]);

      const resolved = await fetchRegistryMetadata(baseUrl, false);

      expect(mockSessionStorageServiceGet).not.toHaveBeenCalled();
      expect(mockFetchData).toHaveBeenCalledTimes(1);
      expect(mockFetchData).toHaveBeenCalledWith('http://this.is.my.base.url/devfiles/index.json');
      expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
      expect(resolved).toEqual([metadata]);
    });
  });

  describe('external registry', () => {
    const baseUrl = 'https://eclipse-che.github.io/che-devfile-registry/7.71.0/';

    it('should fetch the deprecated indexUrl as a second try', async () => {
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      mockFetchData.mockRejectedValueOnce(new Error('Unsupported index URL'));
      mockFetchRemoteData.mockRejectedValueOnce(new Error('Unsupported index URL'));
      mockFetchRemoteData.mockResolvedValueOnce([]);

      await fetchRegistryMetadata(baseUrl, true);

      expect(mockFetchData).toHaveBeenCalledWith(
        'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index',
      );
      expect(mockFetchRemoteData.mock.calls).toEqual([
        [`https://eclipse-che.github.io/che-devfile-registry/7.71.0/index`],
        [`https://eclipse-che.github.io/che-devfile-registry/7.71.0/devfiles/index.json`],
      ]);
    });

    it('should fetch registry metadata', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith(
        'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index',
      );
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index': {
            metadata: [metadata],
            lastFetched: 1555555555555,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });

    describe('getting started samples', () => {
      const baseUrl = 'http://this.is.my.base.url';

      it('should fetch getting started samples', async () => {
        const metadata = {
          displayName: 'java-maven',
          tags: ['Java'],
          url: 'some-url',
          icon: { mediatype: 'image/png', base64data: 'some-data' },
        } as che.DevfileMetaData;
        mockFetchData.mockResolvedValue([metadata]);

        const resolved = await fetchRegistryMetadata(
          `${baseUrl}/dashboard/api/getting-started-sample`,
          false,
        );

        expect(mockSessionStorageServiceGet).not.toHaveBeenCalled();
        expect(mockFetchData).toHaveBeenCalledTimes(1);
        expect(mockFetchData).toHaveBeenCalledWith(
          `${baseUrl}/dashboard/api/getting-started-sample`,
        );
        expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
        expect(resolved).toEqual([metadata]);
      });
    });

    it('should throw an error if fetched data is not array', async () => {
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue('foo');
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      let errorMessage: string | undefined;
      try {
        await fetchRegistryMetadata(baseUrl, true);
      } catch (err) {
        errorMessage = common.helpers.errors.getMessage(err);
      }

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData.mock.calls).toEqual([
        ['https://eclipse-che.github.io/che-devfile-registry/7.71.0/index'],
        ['https://eclipse-che.github.io/che-devfile-registry/7.71.0/devfiles/index.json'],
      ]);
      expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
      expect(errorMessage).toEqual(
        'Failed to fetch devfiles metadata from registry URL: https://eclipse-che.github.io/che-devfile-registry/7.71.0/, reason: Returned value is not array.',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch devfiles metadata from registry URL: https://eclipse-che.github.io/che-devfile-registry/7.71.0/, reason: Returned value is not array.',
      );
    });

    it('should remove objects from fetched array which are not DevfileMetaData', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue([
        {
          name: 'java',
          links: {
            self: '/java',
          },
        },
        metadata,
        'foo',
      ]);
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith(
        'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index',
      );
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index': {
            metadata: [metadata],
            lastFetched: 1555555555555,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });

    it('should not fetch if registry metadata exist and elapsed time les then 60 minutes', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      const time = 1555555555555;
      const elapsedTime = 59 * 60 * 1000;
      mockDateNow.mockReturnValue(time + elapsedTime);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(
        JSON.stringify({
          'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index': {
            metadata: [metadata],
            lastFetched: time,
          },
        }),
      );

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).not.toHaveBeenCalled();
      expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
      expect(resolved).toEqual([metadata]);
    });

    it('should not fetch if registry metadata exist and elapsed time more then 60 minutes', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      const time = 1555555555555;
      const elapsedTime = 61 * 60 * 1000;
      mockDateNow.mockReturnValue(time + elapsedTime);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(
        JSON.stringify({
          'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index': {
            metadata: [metadata],
            lastFetched: time,
          },
        }),
      );

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith(
        'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index',
      );
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://eclipse-che.github.io/che-devfile-registry/7.71.0/index': {
            metadata: [metadata],
            lastFetched: time + elapsedTime,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });
  });

  describe('supporting "registry.devfile.io"', () => {
    const baseUrl = 'https://registry.devfile.io/';

    it('should fetch registry metadata', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith('https://registry.devfile.io/index');
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://registry.devfile.io/index': {
            metadata: [metadata],
            lastFetched: 1555555555555,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });

    it('should throw an error if fetched data is not array', async () => {
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue('foo');
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      let errorMessage: string | undefined;
      try {
        await fetchRegistryMetadata(baseUrl, true);
      } catch (err) {
        errorMessage = common.helpers.errors.getMessage(err);
      }

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith('https://registry.devfile.io/index');
      expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
      expect(errorMessage).toEqual(
        'Failed to fetch devfiles metadata from registry URL: https://registry.devfile.io/, reason: Returned value is not array.',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch devfiles metadata from registry URL: https://registry.devfile.io/, reason: Returned value is not array.',
      );
    });

    it('should remove objects from fetched array which are not DevfileMetaData', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      mockDateNow.mockReturnValue(1555555555555);
      mockFetchRemoteData.mockResolvedValue([
        {
          name: 'java',
          links: {
            self: '/java',
          },
        },
        metadata,
        'foo',
      ]);
      mockSessionStorageServiceGet.mockReturnValue(undefined);

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith('https://registry.devfile.io/index');
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://registry.devfile.io/index': {
            metadata: [metadata],
            lastFetched: 1555555555555,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });

    it('should not fetch if registry metadata exist and elapsed time les then 60 minutes', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      const time = 1555555555555;
      const elapsedTime = 59 * 60 * 1000;
      mockDateNow.mockReturnValue(time + elapsedTime);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(
        JSON.stringify({
          'https://registry.devfile.io/index': {
            metadata: [metadata],
            lastFetched: time,
          },
        }),
      );

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).not.toHaveBeenCalled();
      expect(mockSessionStorageServiceUpdate).not.toHaveBeenCalled();
      expect(resolved).toEqual([metadata]);
    });

    it('should not fetch if registry metadata exist and elapsed time more then 60 minutes', async () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };
      const time = 1555555555555;
      const elapsedTime = 61 * 60 * 1000;
      mockDateNow.mockReturnValue(time + elapsedTime);
      mockFetchRemoteData.mockResolvedValue([metadata]);
      mockSessionStorageServiceGet.mockReturnValue(
        JSON.stringify({
          'https://registry.devfile.io/index': {
            metadata: [metadata],
            lastFetched: time,
          },
        }),
      );

      const resolved = await fetchRegistryMetadata(baseUrl, true);

      expect(mockSessionStorageServiceGet).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
      );
      expect(mockFetchRemoteData).toHaveBeenCalledWith('https://registry.devfile.io/index');
      expect(mockSessionStorageServiceUpdate).toHaveBeenCalledWith(
        SessionStorageKey.EXTERNAL_REGISTRIES,
        JSON.stringify({
          'https://registry.devfile.io/index': {
            metadata: [metadata],
            lastFetched: time + elapsedTime,
          },
        }),
      );
      expect(resolved).toEqual([metadata]);
    });
  });
});

describe('devfile tags', () => {
  describe('internal registry', () => {
    const baseUrl = 'http://this.is.my.base.url';

    it('should return tags without changes', () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: '/devfiles/java-maven/1.2.0',
        },
      } as che.DevfileMetaData;

      const resolved = resolveTags(metadata, baseUrl, false);
      expect(resolved).toEqual(metadata.tags);
    });
  });
  describe('external registry', () => {
    const baseUrl = 'https://registry.devfile.io/';

    it('should add a new tag from the base URL', () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: ['Java'],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      };

      const resolved = resolveTags(metadata, baseUrl, true);
      expect(resolved).not.toEqual(metadata.tags);
      expect(resolved).toEqual(['Java', 'Devfile.io']);
    });
  });
});

describe('devfile links', () => {
  const baseUrl = 'http://this.is.my.base.url';

  describe('internal registry', () => {
    it('should update links that are not absolute', () => {
      const metadata = {
        displayName: 'nodejs-react',
        icon: '/icon.png',
        tags: [],
        links: {
          v2: 'https://github.com/che-samples/nodejs-react-redux/tree/devfilev2',
          self: '/devfiles/nodejs-react/devfile.yaml',
          devWorkspaces: {
            'eclipse/che-theia/latest': '/devfiles/nodejs-react/devworkspace-che-theia-latest.yaml',
            'eclipse/che-theia/next': '/devfiles/nodejs-react/devworkspace-che-theia-next.yaml',
          },
        },
      } as che.DevfileMetaData;

      const resolved = resolveLinks(metadata, baseUrl, false);
      // this one is not updated as already absolute
      expect(resolved.v2).toBe('https://github.com/che-samples/nodejs-react-redux/tree/devfilev2');
      expect(resolved.self).toBe(`${baseUrl}/devfiles/nodejs-react/devfile.yaml`);
      expect(resolved.devWorkspaces['eclipse/che-theia/latest']).toBe(
        `${baseUrl}/devfiles/nodejs-react/devworkspace-che-theia-latest.yaml`,
      );
      expect(resolved.devWorkspaces['eclipse/che-theia/next']).toBe(
        `${baseUrl}/devfiles/nodejs-react/devworkspace-che-theia-next.yaml`,
      );
    });
  });

  describe('external registry', () => {
    const baseUrl = 'https://registry.devfile.io/';

    it('should generate a "v2" link', () => {
      const metadata = {
        displayName: 'java-maven',
        icon: '/icon.png',
        tags: [],
        links: {
          self: 'devfile-catalog/java-maven:1.2.0',
        },
      } as che.DevfileMetaData;

      const resolved = resolveLinks(metadata, baseUrl, true);
      expect(resolved.v2).toBe('https://registry.devfile.io/devfiles/java-maven/1.2.0');
      expect(resolved.self).toBeUndefined;
    });
  });

  it('should update links', () => {
    const object = '/devfile/foo.yaml';
    const updated = updateObjectLinks(object, baseUrl);

    expect(updated).toBe(`${baseUrl}/devfile/foo.yaml`);
  });

  it('should not update absolute link', () => {
    const object = 'http://asbolute.link';
    const updated = updateObjectLinks(object, baseUrl);

    // this one is not updated as already absolute
    expect(updated).toBe('http://asbolute.link');
  });

  it('should update complex objects', () => {
    const object = {
      link1: '/devfile/foo.yaml',
      links: {
        link2: '/devfile/bar.yaml',
      },
      otherLinks: {
        subLinks: {
          subSubLinks: {
            link3: '/devfile/baz.yaml',
          },
        },
      },
    };
    const updated = updateObjectLinks(object, baseUrl);

    // updating all links
    expect(updated.link1).toBe(`${baseUrl}/devfile/foo.yaml`);
    expect(updated.links.link2).toBe(`${baseUrl}/devfile/bar.yaml`);
    expect(updated.otherLinks.subLinks.subSubLinks.link3).toBe(`${baseUrl}/devfile/baz.yaml`);
  });
});
