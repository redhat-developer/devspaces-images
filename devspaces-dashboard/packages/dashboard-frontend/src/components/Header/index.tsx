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
  Breadcrumb,
  BreadcrumbItem,
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
import React from 'react';

import WorkspaceStatusLabel from '@/components/WorkspaceStatusLabel';
import styles from '@/pages/WorkspaceDetails/Header/index.module.css';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';

const SECTION_THEME = PageSectionVariants.light;

type Props = {
  hideBreadcrumbs?: boolean;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  title: string;
};

class Header extends React.PureComponent<Props> {
  private handleClick(): void {
    // clear browsing attribute
    window.name = '';
  }

  public render(): React.ReactElement {
    const { title, status, hideBreadcrumbs } = this.props;

    return (
      <PageSection variant={SECTION_THEME}>
        <Stack hasGutter={true}>
          {!hideBreadcrumbs && (
            <StackItem>
              <Breadcrumb className={styles.breadcrumb}>
                <BreadcrumbItem to={'/dashboard/'} onClick={() => this.handleClick()}>
                  Workspaces
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{title}</BreadcrumbItem>
              </Breadcrumb>
            </StackItem>
          )}
          <StackItem>
            <Flex>
              <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
                <TextContent>
                  <Text component={TextVariants.h1}>{title}</Text>
                </TextContent>
              </FlexItem>
              <FlexItem>
                <WorkspaceStatusLabel status={status} />
              </FlexItem>
            </Flex>
          </StackItem>
        </Stack>
      </PageSection>
    );
  }
}

export default Header;
