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
import {
  Flex,
  FlexItem,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import WorkspaceStatusLabel from '../../../components/WorkspaceStatusLabel';

import styles from './index.module.css';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '../../../services/helpers/types';

type Props = {
  workspacesLink: string;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  workspaceName: string;
  children: React.ReactNode;
};

class Header extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { workspaceName, status, children, workspacesLink } = this.props;

    return (
      <PageSection variant={PageSectionVariants.light}>
        <Stack hasGutter={true}>
          <StackItem>
            <Breadcrumb className={styles.breadcrumb}>
              <BreadcrumbItem to={workspacesLink}>Workspaces</BreadcrumbItem>
              <BreadcrumbItem isActive>{workspaceName}</BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
          <StackItem>
            <Flex>
              <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
                <TextContent>
                  <Text component={TextVariants.h1}>{workspaceName}</Text>
                </TextContent>
              </FlexItem>
              <FlexItem>
                <WorkspaceStatusLabel status={status} />
              </FlexItem>
              <FlexItem className={styles.actionButtons} align={{ default: 'alignRight' }}>
                {children}
              </FlexItem>
            </Flex>
          </StackItem>
        </Stack>
      </PageSection>
    );
  }
}

export default Header;
