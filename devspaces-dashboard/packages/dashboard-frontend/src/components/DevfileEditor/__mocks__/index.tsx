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

import React, { ChangeEvent, ClipboardEvent } from 'react';
import { dump } from 'js-yaml';
import devfileApi from '../../../services/devfileApi';
import stringify from '../../../services/helpers/editor';

type Props = {
  devfile: che.WorkspaceDevfile | devfileApi.Devfile;
  decorationPattern?: string;
  onChange: (newValue: string, isValid: boolean) => void;
  isReadonly?: boolean;
};
type State = {
  errorMessage: string;
};

export default class DevfileEditor extends React.PureComponent<Props, State> {
  private editor: HTMLTextAreaElement;

  constructor(props: Props) {
    super(props);

    this.state = {
      errorMessage: '',
    };
  }

  public updateContent(devfile: che.WorkspaceDevfile | devfileApi.Devfile): void {
    if (!this.editor) {
      return;
    }
    this.editor.value = stringify(devfile);
  }

  public componentDidMount(): void {
    const element = document.querySelector('#devfile-editor');
    if (element) {
      const value = dump(this.props.devfile);
      this.editor = element as HTMLTextAreaElement;
      this.editor.value = value;
    }
  }

  public render(): React.ReactElement {
    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = event.currentTarget.value;
      this.onChange(newContent, true);
    };

    const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const newContent = event.clipboardData?.getData('Text') || '';
      this.onChange(newContent, true);
    };

    return (
      <div className="devfile-editor">
        <div className="monaco">
          <textarea id="devfile-editor" onChange={onChange} onPaste={onPaste}></textarea>
        </div>
        <div className="error"></div>
        <a target="_blank" rel="noopener noreferrer">
          Devfile Documentation
        </a>
      </div>
    );
  }

  private onChange(newValue: string, isValid: boolean): void {
    this.props.onChange(newValue, isValid);
  }
}
