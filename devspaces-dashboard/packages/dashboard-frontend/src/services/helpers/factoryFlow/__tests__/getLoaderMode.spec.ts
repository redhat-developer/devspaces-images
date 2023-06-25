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

import { Location } from 'history';
import { getLoaderMode, LoaderMode } from '../getLoaderMode';

describe('getLoaderMode', () => {
  const namespace = 'user-che';
  const workspaceName = 'some-workspace-name';

  it('should return factory mode ', () => {
    const location = { pathname: '/load-factory' } as Location<unknown>;
    const expected: LoaderMode = { mode: 'factory' };
    expect(getLoaderMode(location)).toEqual(expected);
  });

  it('should return workspace mode', () => {
    const location = { pathname: `/ide/${namespace}/${workspaceName}` } as Location<unknown>;
    const expected: LoaderMode = {
      mode: 'workspace',
      workspaceParams: { namespace, workspaceName },
    };
    expect(getLoaderMode(location)).toEqual(expected);
  });
});
