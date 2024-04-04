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

import { Button, Flex, FlexItem } from '@patternfly/react-core';
import React from 'react';

const DOCS_DEFINING_A_COMMON_IDE =
  'https://eclipse.dev/che/docs/stable/end-user-guide/defining-a-common-ide/';

export class DocsLink extends React.PureComponent {
  public render() {
    return (
      <Flex>
        <FlexItem align={{ default: 'alignRight' }}>
          <Button
            component="a"
            href={DOCS_DEFINING_A_COMMON_IDE}
            variant="link"
            isInline
            target="_blank"
          >
            How to specify and use a custom editor
          </Button>
        </FlexItem>
      </Flex>
    );
  }
}
