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

import { container } from '@/inversify.config';
import { IssuesReporterService } from '@/services/bootstrap/issuesReporter';

const issuesReporterService = container.get(IssuesReporterService);

describe('Issues Reporter', () => {
  afterEach(() => {
    issuesReporterService.clearIssues();
  });

  test('report issues', () => {
    const error_1 = new Error('Error message 1');
    const error_2 = new Error('Error message 2');

    issuesReporterService.registerIssue('workspaceStoppedError', error_1);
    issuesReporterService.registerIssue('workspaceRunTimeout', error_2, {
      ideLoaderPath: 'MockIdeLoaderPath',
      workspaceDetailsPath: 'MockWorkspaceDetailsPath',
    });

    expect(issuesReporterService.hasIssue).toBeTruthy();
    expect(issuesReporterService.reportIssue()).toEqual({
      data: {
        ideLoaderPath: 'MockIdeLoaderPath',
        workspaceDetailsPath: 'MockWorkspaceDetailsPath',
      },
      error: error_2,
      type: 'workspaceRunTimeout',
    });
    expect(issuesReporterService.reportAllIssues()).toEqual([
      {
        data: undefined,
        error: error_1,
        type: 'workspaceStoppedError',
      },
      {
        data: {
          ideLoaderPath: 'MockIdeLoaderPath',
          workspaceDetailsPath: 'MockWorkspaceDetailsPath',
        },
        error: error_2,
        type: 'workspaceRunTimeout',
      },
    ]);

    issuesReporterService.clearIssues();

    expect(issuesReporterService.hasIssue).toBeFalsy();
    expect(issuesReporterService.reportIssue()).toBeUndefined();
    expect(issuesReporterService.reportAllIssues()).toEqual([]);
  });
});
