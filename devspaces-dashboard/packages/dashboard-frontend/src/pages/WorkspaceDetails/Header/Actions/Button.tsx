/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { Button } from '@patternfly/react-core';
import { WorkspaceAction } from '../../../../services/helpers/types';
import { ActionContextType } from '../../../../containers/WorkspaceActions/context';

type Props = {
  context: ActionContextType;
  onAction: (action: WorkspaceAction, context: ActionContextType) => void;
};

export default class ButtonAction extends React.PureComponent<Props> {
  render(): React.ReactElement {
    return (
      <Button
        variant="danger"
        isDisabled={false}
        onClick={async () =>
          this.props.onAction(WorkspaceAction.DELETE_WORKSPACE, this.props.context)
        }
      >
        {WorkspaceAction.DELETE_WORKSPACE}
      </Button>
    );
  }
}
