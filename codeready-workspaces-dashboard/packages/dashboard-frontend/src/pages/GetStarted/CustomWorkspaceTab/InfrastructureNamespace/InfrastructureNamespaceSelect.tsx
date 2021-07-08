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
import { Select, SelectVariant, SelectOption } from '@patternfly/react-core';

type Props = {
  fieldId: string;
  namespaces: che.KubernetesNamespace[];
  onSelect: (namespace: che.KubernetesNamespace) => void;
}
type State = {
  selected: string;
  isExpanded: boolean;
}

export class InfrastructureNamespaceSelect extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    const defaultNamespace = this.props.namespaces
      .find(namespace => namespace.attributes.default === 'true') || this.props.namespaces[0];

    this.state = {
      isExpanded: false,
      selected: this.getDisplayName(defaultNamespace),
    };
  }

  private getDisplayName(namespace: che.KubernetesNamespace): string {
    return namespace.attributes.displayName || namespace.name;
  }

  private handleToggle(isExpanded: boolean): void {
    this.setState({ isExpanded });
  }

  private handleSelect(event: React.MouseEvent | React.ChangeEvent, selected: any): void {
    const selectedNamespace = this.props.namespaces.find(namespace =>
      namespace.attributes.displayName === selected
      || namespace.name === selected
    );

    this.setState({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      selected: this.getDisplayName(selectedNamespace!),
      isExpanded: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.props.onSelect(selectedNamespace!);
  }

  render(): React.ReactNode {
    const options = this.props.namespaces.map(namespace =>
      namespace.attributes.displayName || namespace.name);

    return (
      <Select
        variant={SelectVariant.single}
        aria-label="Infrastructure Namespace Selector"
        onToggle={isExpanded => this.handleToggle(isExpanded)}
        onSelect={(event, selected) => this.handleSelect(event, selected)}
        selections={this.state.selected}
        isOpen={this.state.isExpanded}
        toggleId={this.props.fieldId}
      >
        {options.map((option, index) => (
          <SelectOption
            key={index}
            value={option}
          />
        ))}
      </Select>
    );
  }

}
