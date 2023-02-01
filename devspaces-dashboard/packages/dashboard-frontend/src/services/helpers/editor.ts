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

import { dump } from 'js-yaml';
import {
  LanguageConfiguration,
  IMonarchLanguage,
} from 'monaco-editor-core/esm/vs/editor/editor.main';
import devfileApi from '../devfileApi';

const sortOrder: Array<keyof che.WorkspaceDevfile | keyof devfileApi.Devfile> = [
  'apiVersion',
  'schemaVersion',
  'metadata',
  'attributes',
  'projects',
  'components',
  'commands',
];

const lineWidth = 9999;

function sortKeys(key1: keyof che.WorkspaceDevfile, key2: keyof che.WorkspaceDevfile): -1 | 0 | 1 {
  const index1 = sortOrder.indexOf(key1);
  const index2 = sortOrder.indexOf(key2);
  if (index1 === -1 && index2 === -1) {
    return 0;
  }
  if (index1 === -1) {
    return 1;
  }
  if (index2 === -1) {
    return -1;
  }
  if (index1 < index2) {
    return -1;
  }
  if (index1 > index2) {
    return 1;
  }
  return 0;
}

/**
 * Provides a devfile stringify function.
 */
export default function stringify(
  obj: che.WorkspaceDevfile | devfileApi.Devfile | devfileApi.DevWorkspace,
): string {
  if (!obj) {
    return '';
  }
  return dump(obj, { lineWidth, sortKeys });
}

/**
 * Provides a configuration.
 */
export const conf = {
  comments: { lineComment: '#' },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    {
      open: '"',
      close: '"',
    },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    {
      open: '"',
      close: '"',
    },
    { open: "'", close: "'" },
  ],
  folding: { offSide: true },
} as LanguageConfiguration;

/**
 * Provides the language support.
 */
export const language = {
  tokenPostfix: '.yaml',
  brackets: [
    { token: 'delimiter.bracket', open: '{', close: '}' },
    { token: 'delimiter.square', open: '[', close: ']' },
  ],
  keywords: ['true', 'True', 'TRUE', 'false', 'False', 'FALSE', 'null', 'Null', 'Null', '~'],
  numberInteger: /(?:0|[+-]?[0-9]+)/,
  numberFloat: /(?:0|[+-]?[0-9]+)(?:\.[0-9]+)?(?:e[-+][1-9][0-9]*)?/,
  numberOctal: /0o[0-7]+/,
  numberHex: /0x[0-9a-fA-F]+/,
  numberInfinity: /[+-]?\.(?:inf|Inf|INF)/,
  numberNaN: /\.(?:nan|Nan|NAN)/,
  numberDate: /\d{4}-\d\d-\d\d([Tt ]\d\d:\d\d:\d\d(\.\d+)?(( ?[+-]\d\d?(:\d\d)?)|Z)?)?/,
  escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@comment' },
      [/%[^ ]+.*$/, 'meta.directive'],
      [/---/, 'operators.directivesEnd'],
      [/\.{3}/, 'operators.documentEnd'],
      [/[-?:](?= )/, 'operators'],
      { include: '@anchor' },
      { include: '@tagHandle' },
      { include: '@flowCollections' },
      { include: '@blockStyle' },
      [/@numberInteger(?![ \t]*\S+)/, 'number'],
      [/@numberFloat(?![ \t]*\S+)/, 'number.float'],
      [/@numberOctal(?![ \t]*\S+)/, 'number.octal'],
      [/@numberHex(?![ \t]*\S+)/, 'number.hex'],
      [/@numberInfinity(?![ \t]*\S+)/, 'number.infinity'],
      [/@numberNaN(?![ \t]*\S+)/, 'number.nan'],
      [/@numberDate(?![ \t]*\S+)/, 'number.date'],
      [/(".*?"|'.*?'|.*?)([ \t]*)(:)( |$)/, ['type', 'white', 'operators', 'white']],
      { include: '@flowScalars' },
      [/.+$/, { cases: { '@keywords': 'keyword', '@default': 'string' } }],
    ],
    object: [
      { include: '@whitespace' },
      { include: '@comment' },
      [/}/, '@brackets', '@pop'],
      [/,/, 'delimiter.comma'],
      [/:(?= )/, 'operators'],
      [/(?:".*?"|'.*?'|[^,{[]+?)(?=: )/, 'type'],
      { include: '@flowCollections' },
      { include: '@flowScalars' },
      { include: '@tagHandle' },
      { include: '@anchor' },
      { include: '@flowNumber' },
      [/[^},]+/, { cases: { '@keywords': 'keyword', '@default': 'string' } }],
    ],
    array: [
      { include: '@whitespace' },
      { include: '@comment' },
      [/]/, '@brackets', '@pop'],
      [/,/, 'delimiter.comma'],
      { include: '@flowCollections' },
      { include: '@flowScalars' },
      { include: '@tagHandle' },
      { include: '@anchor' },
      { include: '@flowNumber' },
      [/[^\],]+/, { cases: { '@keywords': 'keyword', '@default': 'string' } }],
    ],
    multiString: [[/^( +).+$/, 'string', '@multiStringContinued.$1']],
    multiStringContinued: [
      [
        /^( *).+$/,
        { cases: { '$1==$S2': 'string', '@default': { token: '@rematch', next: '@popall' } } },
      ],
    ],
    whitespace: [[/[ \t\r\n]+/, 'white']],
    comment: [[/#.*$/, 'comment']],
    flowCollections: [
      [/\[/, '@brackets', '@array'],
      [/{/, '@brackets', '@object'],
    ],
    flowScalars: [
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'[^']*'/, 'string'],
      [/"/, 'string', '@doubleQuotedString'],
    ],
    doubleQuotedString: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
    blockStyle: [[/[>|][0-9]*[+-]?$/, 'operators', '@multiString']],
    flowNumber: [
      [/@numberInteger(?=[ \t]*[,\]}])/, 'number'],
      [/@numberFloat(?=[ \t]*[,\]}])/, 'number.float'],
      [/@numberOctal(?=[ \t]*[,\]}])/, 'number.octal'],
      [/@numberHex(?=[ \t]*[,\]}])/, 'number.hex'],
      [/@numberInfinity(?=[ \t]*[,\]}])/, 'number.infinity'],
      [/@numberNaN(?=[ \t]*[,\]}])/, 'number.nan'],
      [/@numberDate(?=[ \t]*[,\]}])/, 'number.date'],
    ],
    tagHandle: [[/![^ ]*/, 'tag']],
    anchor: [[/[&*][^ ]+/, 'namespace']],
  },
} as IMonarchLanguage;
