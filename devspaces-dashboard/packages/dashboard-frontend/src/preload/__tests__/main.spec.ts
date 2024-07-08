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

import { buildFactoryLoaderPath, redirectToDashboard, storePathIfNeeded } from '@/preload/main';
import { REMOTES_ATTR } from '@/services/helpers/factoryFlow/buildFactoryParams';
import SessionStorageService, { SessionStorageKey } from '@/services/session-storage';

describe('test buildFactoryLoaderPath()', () => {
  describe('SSHLocation', () => {
    test('new policy', () => {
      const result = buildFactoryLoaderPath('git@github.com:eclipse-che/che-dashboard.git?new=');
      expect(result).toEqual(
        '/f?policies.create=perclick&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('che-editor parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?che-editor=che-incubator/checode/insiders',
      );
      expect(result).toEqual(
        '/f?che-editor=che-incubator%2Fchecode%2Finsiders&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('editor-image parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?editor-image=quay.io/mloriedo/che-code:copilot-builtin',
      );
      expect(result).toEqual(
        '/f?editor-image=quay.io%2Fmloriedo%2Fche-code%3Acopilot-builtin&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('devfilePath parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?devfilePath=devfilev2.yaml',
      );
      expect(result).toEqual(
        '/f?override.devfileFilename=devfilev2.yaml&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('devWorkspace parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?devWorkspace=/devfiles/devworkspace-che-theia-latest.yaml',
      );
      expect(result).toEqual(
        '/f?devWorkspace=%2Fdevfiles%2Fdevworkspace-che-theia-latest.yaml&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('storageType parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?storageType=ephemeral',
      );
      expect(result).toEqual(
        '/f?storageType=ephemeral&url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git',
      );
    });

    test('unsupported parameter', () => {
      const result = buildFactoryLoaderPath(
        'git@github.com:eclipse-che/che-dashboard.git?unsupportedParameter=foo',
      );
      expect(result).toEqual(
        '/f?url=git%40github.com%3Aeclipse-che%2Fche-dashboard.git%3FunsupportedParameter%3Dfoo',
      );
    });
  });

  describe('FullPathUrl', () => {
    test('new policy', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?new=',
      );
      expect(result).toEqual(
        '/f?policies.create=perclick&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('che-editor parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?che-editor=che-incubator/checode/insiders',
      );
      expect(result).toEqual(
        '/f?che-editor=che-incubator%2Fchecode%2Finsiders&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('devfilePath parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?devfilePath=devfilev2.yaml',
      );
      expect(result).toEqual(
        '/f?override.devfileFilename=devfilev2.yaml&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('devWorkspace parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?devWorkspace=/devfiles/devworkspace-che-theia-latest.yaml',
      );
      expect(result).toEqual(
        '/f?devWorkspace=%2Fdevfiles%2Fdevworkspace-che-theia-latest.yaml&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('storageType parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?storageType=ephemeral',
      );
      expect(result).toEqual(
        '/f?storageType=ephemeral&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('image parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?image=quay.io/devfile/universal-developer-image:latest',
      );
      expect(result).toEqual(
        '/f?image=quay.io%2Fdevfile%2Funiversal-developer-image%3Alatest&url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2',
      );
    });

    test('unsupported parameter', () => {
      const result = buildFactoryLoaderPath(
        'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?unsupportedParameter=foo',
      );
      expect(result).toEqual(
        '/f?url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2%3FunsupportedParameter%3Dfoo',
      );
    });
  });
});

describe('test storePathnameIfNeeded()', () => {
  let mockUpdate: jest.Mock;

  beforeAll(() => {
    mockUpdate = jest.fn();
    SessionStorageService.update = mockUpdate;
  });

  afterEach(() => {
    mockUpdate.mockClear();
  });

  test('regular path', () => {
    storePathIfNeeded('/test');
    expect(mockUpdate).toHaveBeenCalledWith(SessionStorageKey.ORIGINAL_LOCATION_PATH, '/test');
  });

  test('empty path', () => {
    storePathIfNeeded('/');
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
});

describe('test redirectToDashboard()', () => {
  const origin = 'https://che-host';
  let spyWindowLocation: jest.SpyInstance;

  afterEach(() => {
    spyWindowLocation.mockRestore();
  });

  describe('wrong pathname', () => {
    it('should redirect to home', () => {
      spyWindowLocation = createWindowLocationSpy(origin + '/test');

      redirectToDashboard();
      expect(spyWindowLocation).toHaveBeenCalledWith(origin + '/dashboard/');
    });
  });

  describe('factory url', () => {
    test('with HTTP protocol', () => {
      const repoUrl = 'https://repo-url';
      const query = 'new';
      spyWindowLocation = createWindowLocationSpy(origin + '#' + repoUrl + '&' + query);

      redirectToDashboard();
      expect(spyWindowLocation).toHaveBeenCalledWith(
        origin + '/dashboard/f?policies.create=perclick&url=' + encodeURIComponent(repoUrl),
      );
    });

    test('with SHH protocol', () => {
      const repoUrl = 'git@github.com:namespace/myrepo.git';
      const query = 'devfilePath=my-devfile.yaml';
      spyWindowLocation = createWindowLocationSpy(origin + '#' + repoUrl + '&' + query);

      redirectToDashboard();
      expect(spyWindowLocation).toHaveBeenCalledWith(
        origin +
          '/dashboard/f?override.devfileFilename=my-devfile.yaml&url=' +
          encodeURIComponent(repoUrl),
      );
    });
  });

  describe('redirect after authentication', () => {
    it('should redirect to the workspace creation flow', () => {
      const remoteUrl = '{https://origin-url,https://upstream-url}';
      spyWindowLocation = createWindowLocationSpy(origin + '?' + REMOTES_ATTR + '=' + remoteUrl);

      redirectToDashboard();
      expect(spyWindowLocation).toHaveBeenCalledWith(
        origin + '/dashboard/f?remotes=' + encodeURIComponent(remoteUrl),
      );
    });
  });
});

function createWindowLocationSpy(href: string): jest.SpyInstance {
  delete (window as any).location;
  const url = new URL(href);
  (window.location as Partial<Location>) = {
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
  };
  Object.defineProperty(window.location, 'href', {
    set: () => {
      // no-op
    },
    configurable: true,
    get: () => href,
  });
  return jest.spyOn(window.location, 'href', 'set');
}
