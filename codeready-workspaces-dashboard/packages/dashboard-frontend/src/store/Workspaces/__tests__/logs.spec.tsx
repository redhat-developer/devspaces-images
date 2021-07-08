/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { mergeLogs } from '../logs';

describe('Workspaces store > runtime logs', () => {

  it('should correctly merge new logs with the empty logs map', () => {
    const emptyLogsMap = new Map<string, string[]>();
    const newLogsMap = new Map<string, string[]>([
      ['worksId1', ['test log 1.1', 'test log 1.2']],
    ]);
    const resultLogsMap = mergeLogs(emptyLogsMap, newLogsMap);

    expect(resultLogsMap.has('worksId1')).toBeTruthy();

    const worksLog: string[] = resultLogsMap.get('worksId1') || [];
    expect(worksLog.length).toEqual(2);
    expect(worksLog[0]).toEqual('test log 1.1');
    expect(worksLog[1]).toEqual('test log 1.2');
  });

  it('should correctly merge new logs with the non-empty logs map', () => {
    const logsMap = new Map<string, string[]>([
      ['worksId1', ['test log 1.1']],
      ['worksId2', ['test log 2.1']],
    ]);
    const newLogsMap = new Map<string, string[]>([
      ['worksId2', ['test log 2.2']],
    ]);
    const resultLogsMap = mergeLogs(logsMap, newLogsMap);

    expect(resultLogsMap.has('worksId1')).toBeTruthy();

    const worksId1Log: string[] = resultLogsMap.get('worksId1') || [];
    expect(worksId1Log.length).toEqual(1);
    expect(worksId1Log[0]).toEqual('test log 1.1');

    expect(resultLogsMap.has('worksId2')).toBeTruthy();
    const worksId2Log: string[] = resultLogsMap.get('worksId2') || [];
    expect(worksId2Log.length).toEqual(2);
    expect(worksId2Log[0]).toEqual('test log 2.1');
    expect(worksId2Log[1]).toEqual('test log 2.2');
  });

});
