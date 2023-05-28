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

import { FactoryLocation, FactoryLocationAdapter } from '../';
import common from '@eclipse-che/common';

describe('FactoryLocationAdapter Service', () => {
  let factoryLocation: FactoryLocation;

  describe('supported location', () => {
    it('should determine the full path URL', () => {
      const location = 'https://git-test.com/dummy.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isFullPathUrl).toBeTruthy();
      expect(factoryLocation.isSshLocation).toBeFalsy();
    });
    it('should determine the SSH location', () => {
      const location = 'git@git-test.com:git-test.com/dummy.git';

      factoryLocation = new FactoryLocationAdapter(location);

      expect(factoryLocation.isFullPathUrl).toBeFalsy();
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
