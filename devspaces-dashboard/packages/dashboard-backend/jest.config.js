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

const base = require('../../jest.config.base');

module.exports = {
  ...base,
  name: 'dashboard-backend',
  displayName: 'Dashboard backend',
  moduleDirectories: [
    'node_modules',
  ],
  collectCoverageFrom: [
    ...base.collectCoverageFrom,

    '!src/localRun/**',
  ],
  coverageThreshold: {
    global: {
      statements: 81,
      branches: 78,
      functions: 79,
      lines: 81,
    },
  },
};
