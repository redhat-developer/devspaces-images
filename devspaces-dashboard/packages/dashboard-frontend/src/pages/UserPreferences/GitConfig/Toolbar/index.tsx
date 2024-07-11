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
  onAdd: () => void;
};

export class GitConfigToolbar extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <Toolbar style={{ paddingBottom: 0 }}>
        <ToolbarContent>
          <ToolbarItem alignment={{ default: 'alignRight' }}>
            <Button
              variant={ButtonVariant.link}
              icon={<PlusCircleIcon />}
              iconPosition="left"
              onClick={() => this.props.onAdd()}
            >
              Import Git Configuration
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    );
  }
}
