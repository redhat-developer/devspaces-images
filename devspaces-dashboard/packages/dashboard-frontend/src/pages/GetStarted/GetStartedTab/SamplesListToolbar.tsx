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
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextInput,
  TextInputProps,
} from '@patternfly/react-core';
import React from 'react';
import Pluralize from 'react-pluralize';
import { connect, ConnectedProps } from 'react-redux';

import TemporaryStorageSwitch from '@/pages/GetStarted/GetStartedTab/TemporaryStorageSwitch';
import { AppState } from '@/store';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import { selectFilterValue, selectMetadataFiltered } from '@/store/DevfileRegistries/selectors';

type Props = MappedProps & {
  persistVolumesDefault: string;
  onTemporaryStorageChange: (temporary: boolean) => void;
};
type State = {
  filterValue: string;
};

export class SamplesListToolbar extends React.PureComponent<Props, State> {
  handleTextInputChange: TextInputProps['onChange'];
  buildSearchBox: (searchValue: string) => React.ReactElement;

  constructor(props: Props) {
    super(props);

    this.state = {
      filterValue: '',
    };

    this.handleTextInputChange = (searchValue): void => {
      this.setState({ filterValue: searchValue });
      this.props.setFilter(searchValue);
    };
    this.buildSearchBox = (filterValue: string): React.ReactElement => (
      <TextInput
        value={filterValue}
        type="search"
        onChange={this.handleTextInputChange}
        aria-label="Filter samples list"
        placeholder="Filter by"
      />
    );
  }

  componentWillUnmount(): void {
    this.props.clearFilter();
  }

  render(): React.ReactElement {
    const filterValue = this.props.filterValue || '';
    const foundCount = this.props.metadataFiltered.length;

    return (
      <Flex className={'pf-u-m-md pf-u-mb-0 pf-u-mr-0'}>
        <FlexItem>{this.buildSearchBox(filterValue)}</FlexItem>
        <FlexItem>
          <TextContent>
            <Text>{this.buildCount(foundCount, filterValue)}</Text>
          </TextContent>
        </FlexItem>
        <FlexItem align={{ default: 'alignRight' }}>
          <TemporaryStorageSwitch
            persistVolumesDefault={this.props.persistVolumesDefault}
            onChange={this.props.onTemporaryStorageChange}
          />
        </FlexItem>
      </Flex>
    );
  }

  private buildCount(foundCount: number, searchValue: string): React.ReactElement {
    return searchValue === '' ? (
      <span></span>
    ) : (
      <Pluralize
        singular={'item'}
        count={foundCount}
        zero={'Nothing found'}
        data-testid="toolbar-results-count"
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  filterValue: selectFilterValue(state),
  metadataFiltered: selectMetadataFiltered(state),
});

const connector = connect(mapStateToProps, DevfileRegistriesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(SamplesListToolbar);
