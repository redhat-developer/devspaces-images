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

import { Button, InputGroup, ValidatedOptions } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';

import styles from '@/components/InputGroupExtended/index.module.css';

export type Props = React.PropsWithChildren & {
  isLoading: boolean;
  readonly: boolean;
  required: boolean;
  validated?: ValidatedOptions;
  value: string;
  onRemove: (() => void) | undefined;
};

export class InputGroupExtended extends React.PureComponent<Props> {
  private handleRemove(): void {
    this.props.onRemove?.();
  }

  public render(): React.ReactElement {
    const { children, isLoading, readonly, required, value, onRemove } = this.props;

    if (readonly) {
      return <span className={styles.readonly}>{value}</span>;
    }

    const isRemoveDisabled = required || isLoading;
    const canRemove = onRemove !== undefined;

    return (
      <InputGroup className={styles.nameInput}>
        {children}
        {canRemove && (
          <Button
            isDisabled={isRemoveDisabled}
            variant="plain"
            data-testid="button-remove"
            onClick={() => this.handleRemove()}
          >
            <MinusCircleIcon />
          </Button>
        )}
      </InputGroup>
    );
  }
}
