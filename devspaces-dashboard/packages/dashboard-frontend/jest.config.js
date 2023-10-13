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
  displayName: 'Dashboard Frontend',
  moduleDirectories: ['node_modules', '../../node_modules', 'src'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss|styl)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // mapping for absolute imports (see tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [
    '__mocks__/index.tsx',
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.*\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: true,
      },
    ],
  },
  setupFilesAfterEnv: ['./jest.setup.ts'],
  setupFiles: ['./src/inversify.config.ts'],
  collectCoverageFrom: [
    ...base.collectCoverageFrom,

    '!src/**/__tests__/**',
    '!src/**/*.d.{ts,tsx}',
    '!src/**/*.config.ts',
    '!src/**/*.enum.ts',
    '!src/index.tsx',
    '!src/App.tsx',
    '!src/Routes.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 81,
      branches: 85,
      functions: 77,
      lines: 81,
    },
  },
};
