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
import { connect, ConnectedProps } from 'react-redux';
import { Flex, FlexItem, FormGroup, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { AppState } from '../../../../store';
import * as DevfileRegistriesStore from '../../../../store/DevfileRegistries';
import * as FactoryResolverStore from '../../../../store/FactoryResolver';
import { GitRepoLocationInput } from './GitRepoLocationInput';
import { selectWorkspacesSettings } from '../../../../store/Workspaces/Settings/selectors';
import { sanitizeLocation } from '../../../../services/helpers/location';

type Props = MappedProps & {
  onDevfileResolve: (resolverState: FactoryResolverStore.ResolverState, location: string) => void;
};
type State = {
  isLoading: boolean;
};

export class ImportFromGit extends React.PureComponent<Props, State> {
  private factoryResolver: FactoryResolverStore.State;
  private readonly devfileLocationRef: React.RefObject<GitRepoLocationInput>;

  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: false,
    };
    this.devfileLocationRef = React.createRef();
  }

  public componentDidUpdate(): void {
    this.factoryResolver = this.props.factoryResolver;
  }

  private async handleLocationChange(location: string): Promise<void> {
    const factoryUrl = sanitizeLocation<URL>(new window.URL(location));
    // open a new page to handle that
    window.open(`${window.location.origin}/#${factoryUrl.toString()}`, '_blank');
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
                ref={this.devfileLocationRef}
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

const mapStateToProps = (state: AppState) => ({
  factoryResolver: state.factoryResolver,
  workspacesSettings: selectWorkspacesSettings(state),
});

const connector = connect(mapStateToProps, {
  ...DevfileRegistriesStore.actionCreators,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ImportFromGit);
