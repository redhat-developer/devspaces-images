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
import { Bullseye, Page, PageSection, Stack, StackItem } from '@patternfly/react-core';

import styles from './index.module.css';

type Props = {
  children?: React.ReactElement;
};

export class ErrorReporter extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <Page>
        <PageSection
          isFilled={true}
          padding={{ default: 'noPadding' }}
          className={styles.backdropBackground}
        >
          <Stack>
            <StackItem isFilled></StackItem>
            <StackItem className={styles.errorMessageContainer}>
              <Bullseye>{this.props.children}</Bullseye>
            </StackItem>
            <StackItem isFilled></StackItem>
          </Stack>
        </PageSection>
      </Page>
    );
  }
}
