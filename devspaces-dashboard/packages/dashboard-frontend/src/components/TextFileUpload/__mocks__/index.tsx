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

import { Props } from '..';

export class TextFileUpload extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { fieldId, onChange, fileNamePlaceholder, textAreaPlaceholder, validated } = this.props;

    const uploadId = `${fieldId}-upload`;
    const textareaId = `${fieldId}-textarea`;

    return (
      <div>
        <span data-testid={`${fieldId}-validated`}>{validated}</span>
        <input
          id={uploadId}
          data-testid={uploadId}
          placeholder={fileNamePlaceholder}
          onChange={event => onChange(event.target.value, true)}
        />
        <input
          id={textareaId}
          data-testid={textareaId}
          placeholder={textAreaPlaceholder}
          onChange={event => onChange(event.target.value, false)}
        />
      </div>
    );
  }
}
