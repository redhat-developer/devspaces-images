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

import 'codemirror/mode/yaml/yaml';
import 'codemirror/lib/codemirror.css';
import '@/components/DevfileViewer/theme/eclipse-che.css';

import { fromTextArea as CMEditor } from 'codemirror';
import React from 'react';

import styles from '@/components/DevfileViewer/index.module.css';

type Props = {
  isActive: boolean;
  isExpanded: boolean;
  value: string;
  id: string;
};

export class DevfileViewer extends React.PureComponent<Props> {
  private editor: CMEditor | undefined;

  constructor(props: Props) {
    super(props);
  }

  public componentDidMount(): void {
    const element = window.document.querySelector(
      `.${styles.devfileViewer} textarea#${this.props.id}`,
    );
    if (element !== null) {
      const editor = new CMEditor(element, {
        mode: 'yaml',
        theme: 'eclipse-che',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true,
        autoRefresh: true,
      });
      editor.setSize(`100%`, `100%`);
      editor.setValue(this.props.value);

      this.editor = editor;
    }
  }

  public componentDidUpdate(): void {
    if (!this.editor) {
      return;
    }

    this.editor.setValue(this.props.value);
    this.editor.refresh();
    this.editor.focus();
  }

  public render(): React.ReactElement {
    return (
      <div className={styles.devfileViewer}>
        <textarea id={this.props.id}></textarea>
      </div>
    );
  }
}

export default DevfileViewer;
