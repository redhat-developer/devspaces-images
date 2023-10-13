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
    es2020: true,
  },
  extends: ['plugin:react-hooks/recommended', 'plugin:react/recommended', '../../.eslintrc.js'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  env: {
    es6: true,
  },
  plugins: [
    'import',
    'no-relative-import-paths',
    'react',
    'simple-import-sort',
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
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",

    "no-relative-import-paths/no-relative-import-paths": [
      "error",
      { "allowSameFolder": false, 'prefix': '@', 'rootDir': 'src' }
    ]
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
