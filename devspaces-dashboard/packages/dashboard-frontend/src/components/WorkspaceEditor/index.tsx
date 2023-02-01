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

import React from 'react';
import { DisposableCollection } from '../../services/helpers/disposable';
import { languages, editor } from 'monaco-editor-core';
import { getLanguageService, LanguageService } from 'yaml-language-server';
import { initDefaultEditorTheme } from '../../services/monacoThemeRegister';
import stringify, { language, conf } from '../../services/helpers/editor';
import devfileApi from '../../services/devfileApi';
import { isMatch } from 'lodash';

import styles from './index.module.css';

const LANGUAGE_ID = 'yaml';
const YAML_SERVICE = 'yamlService';
const MONACO_CONFIG: editor.IStandaloneEditorConstructionOptions = {
  language: 'yaml',
  wordWrap: 'on',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  readOnly: false,
};

(self as any).MonacoEnvironment = {
  getWorkerUrl: () => './editor.worker.js',
};

type Props = {
  workspace: devfileApi.DevWorkspace;
  isActive: boolean;
};

export class WorkspaceEditor extends React.PureComponent<Props> {
  public static EDITOR_THEME: string | undefined;
  private readonly toDispose = new DisposableCollection();
  private handleResize: () => void;
  private editor: editor.IStandaloneCodeEditor;
  private readonly yamlService: LanguageService;

  constructor(props: Props) {
    super(props);

    // lazy initialization
    if (!window[YAML_SERVICE]) {
      this.yamlService = getLanguageService(() => Promise.resolve(''), {
        resolveRelativePath: () => '',
      });
      window[YAML_SERVICE] = this.yamlService;
    } else {
      this.yamlService = window[YAML_SERVICE];
      return;
    }
    if (!WorkspaceEditor.EDITOR_THEME) {
      // define the default
      WorkspaceEditor.EDITOR_THEME = initDefaultEditorTheme();
    }
    if (
      languages?.getLanguages &&
      languages.getLanguages().find(language => language.id === LANGUAGE_ID) === undefined
    ) {
      // register the YAML language with Monaco
      languages.register({
        id: LANGUAGE_ID,
        extensions: ['.yaml', '.yml'],
        aliases: ['YAML', 'yaml'],
        mimetypes: ['application/yaml'],
      });
      languages.setMonarchTokensProvider(LANGUAGE_ID, language);
      languages.setLanguageConfiguration(LANGUAGE_ID, conf);
    }
  }

  private updateContent(workspace: devfileApi.DevWorkspace): void {
    if (!this.editor) {
      return;
    }
    let value = '';
    try {
      value = stringify(workspace);
    } catch (e) {
      console.error(e);
    }
    const doc = this.editor.getModel();
    doc?.setValue(value);
  }

  public componentDidUpdate(prevProps: Props): void {
    const { workspace } = this.props;
    if (workspace && !isMatch(workspace, prevProps.workspace)) {
      this.updateContent(workspace);
    }
    if (!prevProps.isActive && this.props.isActive && this.handleResize) {
      this.handleResize();
    }
  }

  // This method is called when the component is first added to the document
  public componentDidMount(): void {
    const element = window.document.querySelector(`.${styles.workspaceEditor} .${styles.monaco}`);
    if (element !== null) {
      let value = '';
      try {
        value = stringify(this.props.workspace);
      } catch (e) {
        console.error(e);
      }
      this.editor = editor.create(
        element as HTMLElement,
        Object.assign(
          { value },
          {
            ...MONACO_CONFIG,
            readOnly: true,
          },
        ),
      );
      const doc = this.editor.getModel();
      doc?.updateOptions({ tabSize: 2 });

      const handleResize = (): void => {
        const layout = { height: element.clientHeight, width: element.clientWidth };
        // if the element is hidden
        if (layout.height === 0 || layout.width === 0) {
          return;
        }
        this.editor.layout(layout);
      };
      this.handleResize = handleResize;
      window.addEventListener('resize', handleResize);
      this.toDispose.push({
        dispose: () => {
          window.removeEventListener('resize', handleResize);
        },
      });
    }
  }

  // This method is called when the component is removed from the document
  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  public render(): React.ReactElement {
    return (
      <div className={styles.workspaceEditor}>
        <div className={styles.monaco}>&nbsp;</div>
      </div>
    );
  }
}

export default WorkspaceEditor;
