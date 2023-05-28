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

import { api } from '@eclipse-che/common';
import { Dropdown, DropdownItem, DropdownToggle, FormGroup } from '@patternfly/react-core';
import React from 'react';
import { DEFAULT_GIT_PROVIDER, GIT_PROVIDERS } from '../../../../const';

export type Props = {
  provider: api.GitProvider | undefined;
  onSelect: (provider: api.GitProvider) => void;
};
export type State = {
  isOpen: boolean;
  provider: api.GitProvider | undefined;
};

export class GitProviderSelector extends React.PureComponent<Props, State> {
  private toggleElementId = 'toggle-initial-selection';

  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: false,
      provider: props.provider,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    const { provider } = this.props;
    if (prevProps.provider !== provider) {
      this.setState({ provider });
    }
  }

  private onToggle(isOpen: boolean): void {
    this.setState({ isOpen });
  }

  private onSelect(event: React.SyntheticEvent<HTMLDivElement, Event> | undefined): void {
    const provider = (event?.currentTarget as HTMLDivElement).id as api.GitProvider;

    this.setState({
      isOpen: false,
      provider,
    });
    this.props.onSelect(provider);
  }

  private buildDropdownItems(): React.ReactElement[] {
    return Object.entries(GIT_PROVIDERS)
      .sort((providerEntryA, providerEntryB) => {
        // compare by values
        const providerNameA = providerEntryA[1];
        const providerNameB = providerEntryB[1];
        return providerNameA.localeCompare(providerNameB);
      })
      .map(providerEntry => {
        const [provider, providerName] = providerEntry as [api.GitProvider, string];
        return (
          <DropdownItem key={provider} id={provider} component="button">
            {providerName}
          </DropdownItem>
        );
      });
  }

  public render(): React.ReactElement {
    const { isOpen, provider = DEFAULT_GIT_PROVIDER } = this.state;
    const providerName = GIT_PROVIDERS[provider];

    const dropdownItems = this.buildDropdownItems();

    return (
      <FormGroup label="Provider Name" fieldId="provider-name">
        <Dropdown
          onSelect={(...args) => this.onSelect(...args)}
          toggle={
            <DropdownToggle
              id={this.toggleElementId}
              onToggle={(...args) => this.onToggle(...args)}
            >
              {providerName}
            </DropdownToggle>
          }
          isOpen={isOpen}
          dropdownItems={dropdownItems}
        />
      </FormGroup>
    );
  }
}
