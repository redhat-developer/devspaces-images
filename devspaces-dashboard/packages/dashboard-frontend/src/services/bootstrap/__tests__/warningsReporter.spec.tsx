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
import { WarningsReporterService } from '@/services/bootstrap/warningsReporter';

const warningsReporterService = container.get(WarningsReporterService);

describe('Warnings Reporter', () => {
  afterEach(() => {
    warningsReporterService.clearWarnings();
  });

  test('report warnings', () => {
    const warningMessage_1 = 'Mock warning message 1';
    const warningMessage_2 = 'Mock warning message 2';

    warningsReporterService.registerWarning('key_1', warningMessage_1);
    warningsReporterService.registerWarning('key_2', warningMessage_2);

    expect(warningsReporterService.hasWarning).toBeTruthy();
    expect(warningsReporterService.reportAllWarnings()).toEqual([
      {
        key: 'key_1',
        title: warningMessage_1,
      },
      {
        key: 'key_2',
        title: warningMessage_2,
      },
    ]);

    warningsReporterService.clearWarnings();

    expect(warningsReporterService.hasWarning).toBeFalsy();
    expect(warningsReporterService.reportAllWarnings()).toEqual([]);
  });
});
