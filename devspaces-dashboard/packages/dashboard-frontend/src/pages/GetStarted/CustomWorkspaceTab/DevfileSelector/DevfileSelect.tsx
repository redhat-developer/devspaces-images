/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { Select, SelectVariant, SelectOption, SelectOptionObject } from '@patternfly/react-core';

interface MetadataSelectOptionObject extends SelectOptionObject {
  metadata: che.DevfileMetaData;
}

type Props = {
  metadata: che.DevfileMetaData[];
  onSelect: (meta: che.DevfileMetaData) => void;
  onClear?: () => void;
};
type State = {
  selected?: MetadataSelectOptionObject;
  isOpen: boolean;
};

export class DevfileSelect extends React.PureComponent<Props, State> {
  options: JSX.Element[];

  constructor(props: Props) {
    super(props);

    this.options = this.buildSelectOptions(this.props.metadata);

    this.state = {
      isOpen: false,
    };
  }

  public clearSelect(): void {
    this.setState({
      selected: undefined,
      isOpen: false,
    });
  }

  private buildSelectOptions(metadata: che.DevfileMetaData[]): React.ReactElement[] {
    return metadata.map(meta => (
      <SelectOption key={meta.links.self} value={this.buildOption(meta)} />
    ));
  }

  private buildOption(meta: che.DevfileMetaData): MetadataSelectOptionObject {
    return {
      metadata: meta,
      toString: () => {
        return meta.displayName;
      },
      compareTo: value => {
        if (typeof value !== 'string' || !meta.displayName) {
          return false;
        }

        return meta.displayName.toLowerCase().includes(value.toLowerCase());
      },
    };
  }

  private handleToggle(isExpanded: boolean): void {
    this.setState({
      isOpen: isExpanded,
    });
  }

  private handleSelect(value: string | SelectOptionObject): void {
    const selected = value as MetadataSelectOptionObject;
    this.setState({
      selected,
      isOpen: false,
    });
    this.props.onSelect(selected.metadata);
  }

  private handleClearSelection(): void {
    this.setState({
      selected: undefined,
      isOpen: false,
    });
    if (this.props.onClear) {
      this.props.onClear();
    }
  }

  private handleCustomFilter(e: React.ChangeEvent<HTMLInputElement>): React.ReactElement[] {
    const input = e.target.value.toString();
    const typeaheadFilteredChildren =
      input !== ''
        ? this.options.filter(option => option.props.value.compareTo(input))
        : this.options;
    return typeaheadFilteredChildren;
  }

  render() {
    const { isOpen, selected } = this.state;
    const titleId = 'typeahead-select-defile-id';

    return (
      <div>
        <span id={titleId} hidden>
          Select a devfile template
        </span>
        <Select
          aria-labelledby={titleId}
          isOpen={isOpen}
          onClear={() => this.handleClearSelection()}
          onFilter={event => this.handleCustomFilter(event)}
          onSelect={(event, value) => this.handleSelect(value)}
          onToggle={isExpanded => this.handleToggle(isExpanded)}
          placeholderText="Select a devfile template"
          selections={selected}
          typeAheadAriaLabel="Select a devfile template"
          variant={SelectVariant.typeahead}
        >
          {this.options}
        </Select>
      </div>
    );
  }
}
