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
  displayName: 'Dashboard backend',
  moduleDirectories: [
    'node_modules',
  ],
  moduleNameMapper: {
    // mapping for absolute imports (see tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    ...base.collectCoverageFrom,

    '!src/localRun/**',
    '!src/utils/**',
    '!src/server.ts',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageThreshold: {
    global: {
      statements: 81,
      branches: 78,
      functions: 78,
      lines: 81,
    },
  },
};
