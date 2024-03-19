/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Form } from '@patternfly/react-core';
import React from 'react';

import { EditorDefinitionField } from '@/components/EditorSelector/Definition/DefinitionField';
import { EditorImageField } from '@/components/EditorSelector/Definition/ImageField';

export type Props = {
  editorDefinition: string | undefined;
  editorImage: string | undefined;
  onChange: (editorId: string | undefined, editorImage: string | undefined) => void;
};

export type State = {
  editorDefinition: string | undefined;
  editorImage: string | undefined;
};

export class EditorDefinition extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      editorDefinition: props.editorDefinition,
      editorImage: props.editorImage,
    };
  }

  private handleEditorDefinition(editorDefinition: string | undefined) {
    const { editorImage } = this.state;

    this.setState({ editorDefinition });
    this.props.onChange(editorDefinition, editorImage);
  }

  private handleEditorImage(editorImage: string | undefined) {
    const { editorDefinition } = this.state;

    this.setState({ editorImage });
    this.props.onChange(editorDefinition, editorImage);
  }

  public render() {
    return (
      <Form isHorizontal={true} onSubmit={e => e.preventDefault()}>
        <EditorDefinitionField
          onChange={editorDefinition => this.handleEditorDefinition(editorDefinition)}
        />
        <EditorImageField onChange={editorImage => this.handleEditorImage(editorImage)} />
      </Form>
    );
  }
}
