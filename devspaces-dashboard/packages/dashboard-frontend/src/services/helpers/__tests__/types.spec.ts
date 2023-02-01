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

import { DevWorkspaceStatus, isDevWorkspaceStatus } from '../types';

describe('typeguards', () => {
  describe('isDevWorkspaceStatus', () => {
    test('with a correct value', () => {
      const status = DevWorkspaceStatus.RUNNING;
      expect(status).toEqual('Running');
      expect(isDevWorkspaceStatus(status)).toBeTruthy();
    });

    test('with wrong values', () => {
      const wrongStatus1 = 'RUNNING';
      expect(isDevWorkspaceStatus(wrongStatus1)).toBeFalsy();

      const wrongStatus2 = true;
      expect(isDevWorkspaceStatus(wrongStatus2)).toBeFalsy();

      const wrongStatus3 = 1;
      expect(isDevWorkspaceStatus(wrongStatus3)).toBeFalsy();
    });
  });
});
