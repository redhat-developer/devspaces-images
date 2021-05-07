/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Flex,
  FlexItem,
  FormGroup,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { AppState } from '../../../../store';
import * as DevfileRegistriesStore from '../../../../store/DevfileRegistries';
import * as FactoryResolverStore from '../../../../store/FactoryResolver';
import { DevfileSelect } from './DevfileSelect';
import { DevfileLocationInput } from './DevfileLocationInput';
import { AlertItem } from '../../../../services/helpers/types';
import { safeLoad } from 'js-yaml';

import styles from './index.module.css';

type Props =
  MappedProps
  & {
    devfileRegistries: DevfileRegistriesStore.State;
    onDevfile: (devfile: che.WorkspaceDevfile) => void;
    onClear?: () => void;
  };
type State = {
  isLoading: boolean;
  alerts: AlertItem[];
  metadata: che.DevfileMetaData[];
};

export class DevfileSelectorFormGroup extends React.PureComponent<Props, State> {
  private factoryResolver: FactoryResolverStore.State;
  private readonly devfileSelectRef: React.RefObject<DevfileSelect>;
  private readonly devfileLocationRef: React.RefObject<DevfileLocationInput>;

  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: false,
      alerts: [],
      metadata: this.props.devfileRegistries.metadata,
    };

    this.devfileSelectRef = React.createRef();
    this.devfileLocationRef = React.createRef();
  }

  public componentDidUpdate(): void {
    this.factoryResolver = this.props.factoryResolver;
  }

  private handleDevfileClear(): void {
    if (this.props.onClear) {
      this.props.onClear();
    }
  }

  private async handleDevfileSelect(meta: che.DevfileMetaData): Promise<void> {
    // clear location input
    this.devfileLocationRef.current?.clearInput();
    try {
      const devfileContent = await this.props.requestDevfile(meta.links.self) as string;
      const devfile = safeLoad(devfileContent);
      this.props.onDevfile(devfile);
    } catch (e) {
      this.showAlert({
        key: 'load-devfile-failed',
        title: `Failed to load devfile. ${e}`,
        variant: AlertVariant.danger,
      });
    }
  }

  private async handleLocationChange(location: string): Promise<void> {
    // clear devfile select
    this.devfileSelectRef.current?.clearSelect();
    try {
      this.setState({ isLoading: true });
      await this.props.requestFactoryResolver(location);
      const { resolver } = this.factoryResolver;
      if (resolver.source === 'repo') {
        throw new Error('devfile.yaml not found in the specified GitHub repository root.');
      }
      this.props.onDevfile(resolver.devfile as che.WorkspaceDevfile);
      this.setState({ isLoading: false });
    } catch (e) {
      this.setState({ isLoading: false });
      this.devfileLocationRef.current?.invalidateInput();
      this.showAlert({
        key: 'load-factory-resolver-failed',
        title: `Failed to resolve or load the devfile. ${e}`,
        variant: AlertVariant.danger,
      });
    }
  }

  private showAlert(alert: AlertItem): void {
    const alerts = [...this.state.alerts, alert];
    this.setState({ alerts });
  }

  private removeAlert(key: string): void {
    this.setState({ alerts: [...this.state.alerts.filter(al => al.key !== key)] });
  }

  public render(): React.ReactNode {
    const { alerts, metadata, isLoading } = this.state;

    return (
      <React.Fragment>
        <AlertGroup isToast>
          {alerts.map(({ title, variant, key }) => (
            <Alert
              variant={variant}
              title={title}
              key={key}
              actionClose={<AlertActionCloseButton onClose={() => this.removeAlert(key)} />}
            />
          ))}
        </AlertGroup>
        <FormGroup
          label='Devfile'
          isRequired
          fieldId='devfile-selector'
        >
          <TextContent>
            <Text component={TextVariants.small}>
              Select a devfile from a templates or enter devfile URL
            </Text>
          </TextContent>
          <Flex direction={{ default: 'column', lg: 'row' }}>
            <Flex
              direction={{ default: 'row' }}
            >
              <FlexItem grow={{ default: 'grow' }} className={styles.templateSelector}>
                <DevfileSelect
                  ref={this.devfileSelectRef}
                  metadata={metadata}
                  onSelect={meta => this.handleDevfileSelect(meta)}
                  onClear={() => this.handleDevfileClear()}
                />
              </FlexItem>
              <span>or</span>
            </Flex>
            <FlexItem grow={{ default: 'grow' }}>
              <DevfileLocationInput
                ref={this.devfileLocationRef}
                isLoading={isLoading}
                onChange={location => this.handleLocationChange(location)}
              />
            </FlexItem>
          </Flex>
        </FormGroup>
      </React.Fragment>
    );
  }

}

const mapStateToProps = (state: AppState) => ({
  devfileRegistries: state.devfileRegistries,
  factoryResolver: state.factoryResolver,
});

const connector = connect(
  mapStateToProps,
  {
    ...DevfileRegistriesStore.actionCreators,
    ...FactoryResolverStore.actionCreators,
  },
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(DevfileSelectorFormGroup);
