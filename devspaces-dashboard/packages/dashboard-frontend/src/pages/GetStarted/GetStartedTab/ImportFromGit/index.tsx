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

import { Flex, FlexItem, FormGroup, Text, TextContent, TextVariants } from '@patternfly/react-core';
import React from 'react';

import { GitRepoLocationInput } from '@/pages/GetStarted/GetStartedTab/ImportFromGit/GitRepoLocationInput';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import * as FactoryResolverStore from '@/store/FactoryResolver';

type Props = {
  onDevfileResolve: (resolverState: FactoryResolverStore.ResolverState, location: string) => void;
};
type State = {
  isLoading: boolean;
};

export default class ImportFromGit extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  private async handleLocationChange(location: string): Promise<void> {
    const factory = new FactoryLocationAdapter(location);
    // open a new page to handle that
    window.open(`${window.location.origin}/#${factory.toString()}`, '_blank');
  }

  public render(): React.ReactNode {
    const { isLoading } = this.state;

    return (
      <>
        <FormGroup
          fieldId="import-from-git"
          label={
            <TextContent>
              <Text component={TextVariants.h4}>Import from Git</Text>
            </TextContent>
          }
        >
          <Flex style={{ marginTop: '15px', minHeight: '85px' }}>
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.h5}>
                  Git Repo URL
                  <span className="label-required">&nbsp;*</span>
                </Text>
              </TextContent>
            </FlexItem>
            <FlexItem grow={{ default: 'grow' }}>
              <GitRepoLocationInput
                isLoading={isLoading}
                onChange={location => this.handleLocationChange(location)}
              />
            </FlexItem>
          </Flex>
        </FormGroup>
      </>
    );
  }
}
