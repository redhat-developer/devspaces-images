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

import {
  Button,
  ButtonVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import React from 'react';

export type Props = {
  isDisabled: boolean;
  selectedItems: unknown[];
  onAdd: () => void;
  onDelete: () => void;
};

export class PersonalAccessTokenListToolbar extends React.PureComponent<Props> {
  private handleAdd(): void {
    this.props.onAdd();
  }

  private handleDelete(): void {
    this.props.onDelete();
  }

  public render(): React.ReactElement {
    const { isDisabled, selectedItems } = this.props;

    const isDeleteDisabled = isDisabled || selectedItems.length === 0;
    const isAddTokenDisabled = isDisabled;

    return (
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.danger}
              onClick={() => this.handleDelete()}
              isDisabled={isDeleteDisabled}
            >
              Delete
            </Button>
          </ToolbarItem>
          <ToolbarItem alignment={{ default: 'alignRight' }}>
            <Button
              variant={ButtonVariant.link}
              icon={<PlusCircleIcon />}
              iconPosition="left"
              onClick={() => this.handleAdd()}
              isDisabled={isAddTokenDisabled}
            >
              Add Token
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    );
  }
}
