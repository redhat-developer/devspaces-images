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
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import React from 'react';

export default class NothingFoundEmptyState extends React.PureComponent {
  public render(): React.ReactElement {
    return (
      <EmptyState isFullHeight={true} variant={EmptyStateVariant.small}>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel="h4" size="lg">
          Nothing Found
        </Title>
        <EmptyStateBody>
          No workspaces match the filter criteria. Clear filter to show results.
        </EmptyStateBody>
      </EmptyState>
    );
  }
}
