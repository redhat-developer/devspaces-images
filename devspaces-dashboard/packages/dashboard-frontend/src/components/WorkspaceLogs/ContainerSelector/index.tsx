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

import { V1Pod } from '@kubernetes/client-node';
import { Dropdown, DropdownItem, DropdownSeparator, DropdownToggle } from '@patternfly/react-core';
import React from 'react';

import { ResourceIcon } from '@/components/ResourceIcon';

export type Props = {
  pod: V1Pod | undefined;
  onContainerChange: (containerName: string) => void;
};
export type State = {
  isOpen: boolean;
  containers: string[];
  initContainers: string[];
  currentName: string;
};

export const NO_CONTAINERS = 'No containers';

export class WorkspaceLogsContainerSelector extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const containers = this.getContainerNames();
    const initContainers = this.getInitContainerNames();
    const currentName = this.getFirstContainerName();
    this.state = {
      isOpen: false,
      containers,
      currentName,
      initContainers,
    };
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.pod?.metadata?.name !== this.props.pod?.metadata?.name) {
      this.init();
    }
  }

  private init(): void {
    const containers = this.getContainerNames();
    const initContainers = this.getInitContainerNames();
    const currentName = this.getFirstContainerName();
    this.setState({
      containers,
      currentName,
      initContainers,
    });
    this.props.onContainerChange(currentName);
  }

  private getFirstContainerName(): string {
    return this.getContainerNames()[0] || NO_CONTAINERS;
  }

  private getContainerNames(): string[] {
    return (this.props.pod?.spec?.containers || []).map(container => container.name);
  }

  private getInitContainerNames(): string[] {
    return (this.props.pod?.spec?.initContainers || []).map(container => container.name);
  }

  private onSelect(event?: React.SyntheticEvent<HTMLDivElement>): void {
    this.setState({
      isOpen: false,
    });

    if (event === undefined) {
      return;
    }

    const currentName = event.currentTarget.id;
    if (currentName === null) {
      console.error('Container name is null, event:', event);
      return;
    }

    const { containers, initContainers } = this.state;
    if (
      containers.includes(currentName) === false &&
      initContainers.includes(currentName) === false
    ) {
      console.error('Container name is not in the pod containers or initContainers:', currentName);
      return;
    }

    this.setState({
      currentName,
    });
    this.props.onContainerChange(currentName);
  }

  private onToggle(): void {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  }

  private buildDropdownItems(): React.ReactNode[] {
    const { containers, initContainers } = this.state;
    const icon = <ResourceIcon kind="Container" />;

    const dropdownItems: React.ReactNode[] = [];
    if (containers.length !== 0) {
      dropdownItems.push(
        <DropdownItem key="containers" isDisabled>
          Containers
        </DropdownItem>,
      );
      dropdownItems.push(
        containers.map(container => (
          <DropdownItem id={container} key={container} icon={icon}>
            {container}
          </DropdownItem>
        )),
      );
    }

    if (containers.length !== 0 && initContainers.length !== 0) {
      dropdownItems.push(<DropdownSeparator key="divider" onClick={e => e.stopPropagation()} />);
    }

    if (initContainers.length !== 0) {
      dropdownItems.push(
        <DropdownItem key="init-containers" isDisabled>
          Init Containers
        </DropdownItem>,
      );
      dropdownItems.push(
        initContainers.map(container => (
          <DropdownItem id={container} key={container} icon={icon}>
            {container}
          </DropdownItem>
        )),
      );
    }

    return dropdownItems;
  }

  render() {
    const { currentName, isOpen } = this.state;

    const dropdownItems = this.buildDropdownItems();

    if (dropdownItems.length === 0) {
      return (
        <Dropdown
          toggle={
            <DropdownToggle isPlain icon={<ResourceIcon kind="Container" />}>
              {NO_CONTAINERS}
            </DropdownToggle>
          }
        />
      );
    }

    return (
      <Dropdown
        onSelect={event => this.onSelect(event)}
        toggle={
          <DropdownToggle onToggle={() => this.onToggle()} icon={<ResourceIcon kind="Container" />}>
            {currentName}
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
      />
    );
  }
}
