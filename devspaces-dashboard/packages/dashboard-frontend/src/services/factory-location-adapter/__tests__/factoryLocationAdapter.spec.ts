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

import { FactoryLocation, FactoryLocationAdapter } from '@/services/factory-location-adapter';

describe('FactoryLocationAdapter Service', () => {
  let factoryLocation: FactoryLocation;

  describe('supported location', () => {
    it('should determine the full path URL', () => {
      const location = 'https://git-test.com/dummy.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isHttpLocation).toBeTruthy();
      expect(factoryLocation.isSshLocation).toBeFalsy();
    });
    it('should determine the SSH location', () => {
      const location = 'git@git-test.com:git-test.com/dummy.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isHttpLocation).toBeFalsy();
      expect(factoryLocation.isSshLocation).toBeTruthy();
    });
    it('should determine the SSH location', () => {
      const location = 'user1@repository.example.com:/home/user1/repositories/myrepo.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isHttpLocation).toBeFalsy();
      expect(factoryLocation.isSshLocation).toBeTruthy();
    });
    it('should determine the SSH location', () => {
      const location = 'ssh://azuredevops.user.prv:22/tfs/collection/tools/git/ocp.gitops';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isHttpLocation).toBeFalsy();
      expect(factoryLocation.isSshLocation).toBeTruthy();
    });
    it('should determine the Bitbucket-Server SSH location', () => {
      const location = 'ssh://git@bitbucket-server.com:7999/~user/repo.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isHttpLocation).toBeFalsy();
      expect(factoryLocation.isSshLocation).toBeTruthy();
    });
    it('should determine unsupported factory location', () => {
      const location = 'dummy.git';

      let errorMessage: string | undefined;
      try {
        factoryLocation = new FactoryLocationAdapter(location);
      } catch (err) {
        errorMessage = common.helpers.errors.getMessage(err);
      }

      expect(errorMessage).toEqual('Unsupported factory location: "dummy.git"');
    });
  });

  describe('SSH location', () => {
    it('should determine searchParams', () => {
      const sshLocation = 'git@github.com:eclipse-che/che-dashboard.git';
      const search = 'che-editor=che-incubator/checode/insiders';

      factoryLocation = new FactoryLocationAdapter(`${sshLocation}?${search}`);

      expect(factoryLocation.searchParams.toString()).toEqual(
        'che-editor=che-incubator%2Fchecode%2Finsiders',
      );

      factoryLocation = new FactoryLocationAdapter(`${sshLocation}&${search}`);

      expect(factoryLocation.searchParams.toString()).toEqual(
        'che-editor=che-incubator%2Fchecode%2Finsiders',
      );
    });

    it('should return factory reference without oauth params', () => {
      const sshLocation = 'git@github.com:eclipse-che/che-dashboard.git';
      const oauthParams = 'session_state=63273265623765783252378';
      const params = 'che-editor=che-incubator/checode/insiders';

      factoryLocation = new FactoryLocationAdapter(`${sshLocation}?${oauthParams}&${params}`);

      expect(factoryLocation.toString()).toEqual(
        'git@github.com:eclipse-che/che-dashboard.git?che-editor=che-incubator%2Fchecode%2Finsiders',
      );

      factoryLocation = new FactoryLocationAdapter(`${sshLocation}&${oauthParams}&${params}`);

      expect(factoryLocation.toString()).toEqual(
        'git@github.com:eclipse-che/che-dashboard.git?che-editor=che-incubator%2Fchecode%2Finsiders',
      );
    });
  });

  describe('full path URL', () => {
    it('should determine searchParams', () => {
      const fullPathUrl = 'https://github.com/eclipse-che/che-dashboard.git';
      const search = 'che-editor=che-incubator/checode/insiders';

      factoryLocation = new FactoryLocationAdapter(`${fullPathUrl}?${search}`);

      expect(factoryLocation.searchParams.toString()).toEqual(
        'che-editor=che-incubator%2Fchecode%2Finsiders',
      );

      factoryLocation = new FactoryLocationAdapter(`${fullPathUrl}&${search}`);

      expect(factoryLocation.searchParams.toString()).toEqual(
        'che-editor=che-incubator%2Fchecode%2Finsiders',
      );
    });
  });

  describe('test FactoryLocationAdapter.isHttpLocation', () => {
    it('should return true for https git url', () => {
      const location = 'https://git-test.com/dummy.git';
      expect(FactoryLocationAdapter.isHttpLocation(location)).toBeTruthy();
    });
    it('should return true when git remote specified', () => {
      const location = 'https://git-test.com/dummy.git?remotes={https://git-test.com/remote.git}';
      expect(FactoryLocationAdapter.isHttpLocation(location)).toBeTruthy();
    });
    it('should return true when git remotes and remote names are specified', () => {
      const location =
        'https://git-test.com/dummy.git?remotes={{origin,https://git-test.com/origin.git},{upstream,https://git-test.com/upstream.git}}';
      expect(FactoryLocationAdapter.isHttpLocation(location)).toBeTruthy();
    });
    it('should return true for https git url with whitespace', () => {
      const location = 'https://git-test.com/dum my.git';
      expect(FactoryLocationAdapter.isHttpLocation(location)).toBeTruthy();
    });
  });

  it('should return factory reference without oauth params', () => {
    const fullPathUrl = 'https://github.com/eclipse-che/che-dashboard.git';
    const oauthParams = 'session_state=63273265623765783252378';
    const params = 'che-editor=che-incubator/checode/insiders';

    factoryLocation = new FactoryLocationAdapter(`${fullPathUrl}?${oauthParams}&${params}`);

    expect(factoryLocation.toString()).toEqual(
      'https://github.com/eclipse-che/che-dashboard.git?che-editor=che-incubator%2Fchecode%2Finsiders',
    );

    factoryLocation = new FactoryLocationAdapter(`${fullPathUrl}&${oauthParams}&${params}`);

    expect(factoryLocation.toString()).toEqual(
      'https://github.com/eclipse-che/che-dashboard.git?che-editor=che-incubator%2Fchecode%2Finsiders',
    );
  });
});
