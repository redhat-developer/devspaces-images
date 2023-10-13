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
    node: true,
  },
  extends: [
    '../../.eslintrc.js',
  ],
  plugins: [
    'import',
    'no-relative-import-paths',
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
};
