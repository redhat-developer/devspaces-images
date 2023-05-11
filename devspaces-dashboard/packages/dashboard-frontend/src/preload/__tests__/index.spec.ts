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

import SessionStorageService, { SessionStorageKey } from '../../services/session-storage';
import { buildFactoryLoaderPath, storePathIfNeeded } from '..';

describe('Location test', () => {
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

describe('storePathnameIfNeeded test', () => {
  let mockUpdate: jest.Mock;

  beforeAll(() => {
    mockUpdate = jest.fn();
    SessionStorageService.update = mockUpdate;
  });

  test('empty path', () => {
    storePathIfNeeded('/');
    expect(mockUpdate).toBeCalledTimes(0);
  });

  test('regular path', () => {
    storePathIfNeeded('/test');
    expect(mockUpdate).toBeCalledWith(SessionStorageKey.ORIGINAL_LOCATION_PATH, '/test');
  });
});
