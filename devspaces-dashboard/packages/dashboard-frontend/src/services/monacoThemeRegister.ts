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

import { editor } from 'monaco-editor-core/esm/vs/editor/editor.main';

const DEFAULT_CHE_THEME = 'che';

export const initDefaultEditorTheme = (): string | undefined => {
  if (!editor) {
    return undefined;
  }
  // register the white editor theme
  editor.defineTheme(DEFAULT_CHE_THEME, {
    base: 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      {
        token: 'string.yaml',
        foreground: '000000',
      },
      {
        token: 'comment',
        foreground: '777777',
      },
    ],
    colors: {
      'editor.lineHighlightBackground': '#f0f0f0',
      'editorLineNumber.foreground': '#aaaaaa',
      'editorGutter.background': '#f8f8f8',
    },
  });

  editor.setTheme(DEFAULT_CHE_THEME);

  return DEFAULT_CHE_THEME;
};
