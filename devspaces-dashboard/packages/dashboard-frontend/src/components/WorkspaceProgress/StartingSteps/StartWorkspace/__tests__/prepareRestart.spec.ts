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

import {
  applyRestartDefaultLocation,
  applyRestartInDebugModeLocation,
  applyRestartInSafeModeLocation,
  getRestartInSafeModeLocation,
  getStartParams,
  resetRestartInSafeModeLocation,
} from '@/components/WorkspaceProgress/StartingSteps/StartWorkspace/prepareRestart';

describe('Prepare workspace start', () => {
  test('apply Safe Mode location', () => {
    const location = { search: '?tab=Progress' } as Location<unknown>;

    applyRestartInDebugModeLocation(location);

    expect(location).toEqual({ search: 'tab=Progress&debugWorkspaceStart=true' });
  });

  test('apply Safe Mode location', () => {
    const location = { search: '?tab=Progress' } as Location<unknown>;

    applyRestartInSafeModeLocation(location);

    expect(location).toEqual({ search: 'tab=Progress&useDefaultDevfile=true' });
  });

  test('apply default location', () => {
    const location = { search: '?debugWorkspaceStart=true&tab=Logs' } as Location<unknown>;

    applyRestartDefaultLocation(location);

    expect(location).toEqual({ search: 'tab=Logs' });
  });

  test('reset Safe Mode location', () => {
    const location = { search: '?tab=Logs&useDefaultDevfile=true' } as Location<unknown>;

    let hasChanged = resetRestartInSafeModeLocation(location);

    expect(hasChanged).toBeTruthy();
    expect(location).toEqual({ search: 'tab=Logs' });

    hasChanged = resetRestartInSafeModeLocation(location);

    expect(hasChanged).toBeFalsy();
    expect(location).toEqual({ search: 'tab=Logs' });
  });

  test('get Safe Mode location', () => {
    let hasChanged = getRestartInSafeModeLocation({
      search: '?tab=Logs&useDefaultDevfile=true',
    } as Location<unknown>);

    expect(hasChanged).toBeTruthy();

    hasChanged = getRestartInSafeModeLocation({
      search: '?tab=Logs',
    } as Location<unknown>);

    expect(hasChanged).toBeFalsy();
  });

  test('apply start workspace', async () => {
    const location = { search: '' } as Location<unknown>;
    const startParams = getStartParams(location);

    expect(startParams).toEqual(undefined);
  });

  test('apply start workspace in Debug Mode', async () => {
    const location = { search: '?debugWorkspaceStart=true' } as Location<unknown>;
    const startParams = getStartParams(location);

    expect(startParams).toStrictEqual({
      'debug-workspace-start': true,
    });
  });
});
