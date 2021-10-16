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
import { connect, ConnectedProps } from 'react-redux';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
  EmptyStateVariant,
  Gallery,
  Title,
  AlertVariant,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { AppState } from '../../../store';
import * as DevfileRegistriesStore from '../../../store/DevfileRegistries';
import { SampleCard } from './SampleCard';
import { AlertItem } from '../../../services/helpers/types';
import { selectMetadataFiltered } from '../../../store/DevfileRegistries/selectors';
import { selectWorkspacesSettings } from '../../../store/Workspaces/Settings/selectors';
import * as FactoryResolverStore from '../../../store/FactoryResolver';

type Props =
  MappedProps
  & {
    onCardClick: (devfileContent: string, stackName: string, optionalFilesContent?: {
      [fileName: string]: string
    }) => void;
  };
type State = {
  alerts: AlertItem[];
};

export class SamplesListGallery extends React.PureComponent<Props, State> {
  private isLoading: boolean;

  constructor(props: Props) {
    super(props);

    this.state = {
      alerts: [],
    };
    this.isLoading = false;
  }

  private removeAlert(key: string): void {
    this.setState({ alerts: [...this.state.alerts.filter(al => al.key !== key)] });
  }

  render(): React.ReactElement {
    const metadata = this.props.metadataFiltered;
    const cards = this.buildCardsList(metadata);

    if (cards.length) {
      return (
        <React.Fragment>
          <AlertGroup isToast>
            {this.state.alerts.map(({ title, variant, key }) => (
              <Alert
                variant={variant}
                title={title}
                key={key}
                actionClose={<AlertActionCloseButton onClose={() => this.removeAlert(key)} />}
              />
            ))}
          </AlertGroup>
          <Gallery hasGutter={true}>
            {cards}
          </Gallery>
        </React.Fragment>
      );
    }

    return this.buildEmptyState();
  }

  private async fetchDevfile(meta: che.DevfileMetaData): Promise<void> {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      const cheDevworkspaceEnabled = this.props.workspacesSettings['che.devworkspaces.enabled'] === 'true';
      let devfileContent;
      let optionalFilesContent;
      if (cheDevworkspaceEnabled) {
        const link = meta.links.v2;
        // use factory workflow to load the getting started samples
        const factoryUrl = `${window.location.origin}/#${link}`;
        // open a new page to handle that
        window.open(factoryUrl, '_blank');
        this.isLoading = false;
        return;
      } else {
        devfileContent = await this.props.requestDevfile(meta.links.self) as string;
      }
      this.props.onCardClick(devfileContent, meta.displayName, optionalFilesContent);
    } catch (e) {
      console.warn('Failed to load devfile.', e);

      const alerts = [...this.state.alerts, {
        key: meta.links.self,
        title: `Failed to load devfile "${meta.displayName}"`,
        variant: AlertVariant.warning,
      }];
      this.setState({ alerts });
    }
    this.isLoading = false;
  }

  private buildCardsList(metadata: che.DevfileMetaData[] = []): React.ReactElement[] {
    return metadata.map(meta => (
      <SampleCard
        key={meta.links.self}
        metadata={meta}
        onClick={(): Promise<void> => this.fetchDevfile(meta)}
      />
    ));
  }

  private buildEmptyState(): React.ReactElement {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel='h1'>
          No results found
        </Title>
        <EmptyStateBody>
          No results match the filter criteria. Clear filter to show results.
        </EmptyStateBody>
        <EmptyStatePrimary>
          <Button
            variant='link'
            onClick={(): void => this.props.clearFilter()}>
            Clear filter
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    );
  }

}

const mapStateToProps = (state: AppState) => ({
  metadataFiltered: selectMetadataFiltered(state),
  workspacesSettings: selectWorkspacesSettings(state),
  factoryResolver: state.factoryResolver,
});

const connector = connect(
  mapStateToProps,
  {
    ...DevfileRegistriesStore.actionCreators,
    ...FactoryResolverStore.actionCreators,
  }
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(SamplesListGallery);
