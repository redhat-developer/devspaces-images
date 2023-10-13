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

import { Props, State } from '@/components/WorkspaceLogs/ContainerSelector';

export class WorkspaceLogsContainerSelector extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { pod } = this.props;
    const containers = pod?.spec?.containers.map(container => container.name) || [];
    const initContainers = pod?.spec?.initContainers?.map(container => container.name) || [];

    this.state = {
      isOpen: false,
      containers,
      currentName: '',
      initContainers,
    };
  }

  componentDidMount(): void {
    this.props.onContainerChange(this.state.containers[0]);
  }

  public render(): React.ReactElement {
    const { containers, initContainers } = this.state;

    const buttons = [...containers, ...initContainers].map(containerName => {
      return (
        <button key={containerName} onClick={() => this.props.onContainerChange(containerName)}>
          {containerName}
        </button>
      );
    });

    return <div>{buttons}</div>;
  }
}
