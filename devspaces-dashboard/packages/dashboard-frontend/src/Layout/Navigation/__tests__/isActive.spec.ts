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

import { ROUTE } from '../../../Routes/routes';
import isActive from '../isActive';

describe('Active navigation item', () => {
  it('should match equal paths', () => {
    const itemPath = ROUTE.GET_STARTED;
    const activePath = ROUTE.GET_STARTED;

    expect(isActive(itemPath, activePath)).toEqual(true);
  });

  it('should match the "workspaces list" to the "workspace details" path', () => {
    const itemPath = ROUTE.WORKSPACES;
    const activePath = '/workspace/namespace/workspaceName';

    expect(isActive(itemPath, activePath)).toEqual(true);
  });

  it('should not match to not defined path', () => {
    const itemPath = ROUTE.WORKSPACES;
    expect(isActive(itemPath, undefined)).toEqual(false);
  });

  it('should not match different paths', () => {
    const itemPath = ROUTE.WORKSPACES;
    const activePath = ROUTE.GET_STARTED;
    expect(isActive(itemPath, activePath)).toEqual(false);
  });
});
