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
import { Text, TextContent, TextVariants } from '@patternfly/react-core';

const TITLE = 'Select a Sample';
const DESCRIPTION = 'Select a sample to create your first workspace.';

export class SamplesListHeader extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render(): React.ReactElement {
    return (
      <TextContent className={'pf-u-m-md pf-u-mt-0'}>
        <Text component={TextVariants.h4}>{TITLE}</Text>
        <Text component={TextVariants.small}>{DESCRIPTION}</Text>
      </TextContent>
    );
  }
}
