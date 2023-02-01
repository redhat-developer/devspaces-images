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
import { Title, EmptyState, EmptyStateVariant, EmptyStateIcon } from '@patternfly/react-core';
import { RegistryIcon } from '@patternfly/react-icons';

type Props = {
  text: string;
};

export default class Empty extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <EmptyState isFullHeight={true} variant={EmptyStateVariant.small}>
        <EmptyStateIcon icon={RegistryIcon} />
        <Title headingLevel="h4" size="lg">
          {this.props.text}
        </Title>
      </EmptyState>
    );
  }
}
