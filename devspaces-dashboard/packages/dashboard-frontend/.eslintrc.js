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

module.exports = {
  env: {
    browser: true,
    es2020: true
  },
  extends: [
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    '../../.eslintrc.js',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
  },
  plugins: [
    'react',
  ],
  rules: {
    'notice/notice': [
      'error',
      {
        templateFile: '../../.config/copyright.js',
        onNonMatchingHeader: 'report',
        messages: {
          reportAndSkip: 'Missing license header',
        },
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
