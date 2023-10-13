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

import { Button, Form, InputGroup, ValidatedOptions } from '@patternfly/react-core';
import { CheckIcon, PencilAltIcon, TimesIcon } from '@patternfly/react-icons';
import * as React from 'react';

import styles from '@/components/InputGroupExtended/index.module.css';

export type Props = React.PropsWithChildren & {
  readonly: boolean;
  validated?: ValidatedOptions;
  value: string;
  onCancel: () => void;
  onSave: () => void;
};
export type State = {
  isEditMode: boolean;
};

export class InputGroupExtended extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isEditMode: false,
    };
  }

  private handleEdit(): void {
    this.setState({ isEditMode: true });
  }

  private handleSave(): void {
    this.setState({ isEditMode: false });
    this.props.onSave();
  }

  private handleCancel(): void {
    this.setState({ isEditMode: false });
    this.props.onCancel();
  }

  private handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    if (this.canSave()) {
      this.handleSave();
    }
  }

  private canSave(): boolean {
    const { validated } = this.props;
    return validated === ValidatedOptions.success;
  }

  public render(): React.ReactElement {
    const { children, readonly, value } = this.props;
    const { isEditMode } = this.state;

    if (readonly) {
      return <span className={styles.readonly}>{value}</span>;
    }

    if (isEditMode === false) {
      return (
        <span className={styles.editable}>
          {value}
          <Button data-testid="button-edit" variant="plain" onClick={() => this.handleEdit()}>
            <PencilAltIcon />
          </Button>
        </span>
      );
    }

    const isSaveButtonDisabled = this.canSave() === false;

    return (
      <Form isHorizontal onSubmit={e => this.handleSubmit(e)}>
        <InputGroup className={styles.nameInput}>
          {children}
          <Button
            variant="link"
            data-testid="button-save"
            isDisabled={isSaveButtonDisabled}
            onClick={() => this.handleSave()}
          >
            <CheckIcon />
          </Button>
          <Button variant="plain" data-testid="button-cancel" onClick={() => this.handleCancel()}>
            <TimesIcon />
          </Button>
        </InputGroup>
      </Form>
    );
  }
}
