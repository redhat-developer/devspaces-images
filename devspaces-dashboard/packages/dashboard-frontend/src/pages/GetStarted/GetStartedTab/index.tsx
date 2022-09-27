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
import { Flex, FlexItem, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { AppState } from '../../../store';
import ProgressIndicator from '../../../components/Progress';
import { SamplesListHeader } from './SamplesListHeader';
import SamplesListToolbar from './SamplesListToolbar';
import SamplesListGallery from './SamplesListGallery';
import { selectIsLoading } from '../../../store/Workspaces/selectors';
import { selectWorkspacesSettings } from '../../../store/Workspaces/Settings/selectors';
import { load } from 'js-yaml';
import stringify from '../../../services/helpers/editor';
import ImportFromGit from './ImportFromGit';
import { ResolverState } from '../../../store/FactoryResolver';
import { DevfileAdapter } from '../../../services/devfile/adapter';
import { selectPvcStrategy } from '../../../store/ServerConfig/selectors';

// At runtime, Redux will merge together...
type Props = {
  onDevfile: (
    devfileContent: string,
    stackName: string,
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ) => Promise<void>;
} & MappedProps;
type State = {
  temporary?: boolean;
  persistVolumesDefault: string;
};

export class SamplesListTab extends React.PureComponent<Props, State> {
  private isLoading: boolean;

  constructor(props: Props) {
    super(props);

    const persistVolumesDefault =
      this.props.preferredStorageType === 'ephemeral'
        ? 'false'
        : this.props.workspacesSettings['che.workspace.persist_volumes.default'];

    this.state = {
      persistVolumesDefault,
    };
    this.isLoading = false;
  }

  private handleTemporaryStorageChange(temporary: boolean): void {
    this.setState({ temporary });
  }

  private getStorageType(): che.WorkspaceStorageType {
    if (this.state.temporary === undefined) {
      return this.props.preferredStorageType as che.WorkspaceStorageType;
    }
    if (this.props.preferredStorageType === 'async') {
      return this.state.temporary ? 'ephemeral' : this.props.preferredStorageType;
    }
    return this.state.temporary ? 'ephemeral' : 'persistent';
  }

  private async handleSampleCardClick(
    devfileContent: string,
    stackName: string,
    optionalFilesContent?: { [fileName: string]: string },
  ): Promise<void> {
    if (this.isLoading) {
      return;
    }
    const devfileAdapter = new DevfileAdapter(load(devfileContent));
    devfileAdapter.storageType = this.getStorageType();
    this.isLoading = true;
    try {
      await this.props.onDevfile(
        stringify(devfileAdapter.devfile),
        stackName,
        optionalFilesContent,
      );
    } catch (e) {
      console.warn(e);
    }
    this.isLoading = false;
  }

  private handleDevfileResolver(resolverState: ResolverState, stackName: string): Promise<void> {
    const devfileAdapter = new DevfileAdapter(resolverState.devfile);
    devfileAdapter.storageType = this.props.preferredStorageType as che.WorkspaceStorageType;
    const devfileContent = stringify(devfileAdapter.devfile);

    return this.props.onDevfile(
      devfileContent,
      stackName,
      resolverState.optionalFilesContent || {},
    );
  }

  public render(): React.ReactElement {
    const isLoading = this.props.isLoading;
    const storageType = this.getStorageType();

    return (
      <>
        <ProgressIndicator isLoading={isLoading} />
        <PageSection variant={PageSectionVariants.default} style={{ background: '#f0f0f0' }}>
          <PageSection variant={PageSectionVariants.light}>
            <ImportFromGit
              onDevfileResolve={(resolverState, location) =>
                this.handleDevfileResolver(resolverState, location)
              }
            />
          </PageSection>
          <PageSection
            variant={PageSectionVariants.light}
            style={{ marginTop: 'var(--pf-c-page__main-section--PaddingTop)' }}
          >
            <Flex direction={{ default: 'column' }}>
              <FlexItem spacer={{ default: 'spacerLg' }}>
                <SamplesListHeader />
              </FlexItem>
              <FlexItem grow={{ default: 'grow' }} spacer={{ default: 'spacerLg' }}>
                <SamplesListToolbar
                  persistVolumesDefault={this.state.persistVolumesDefault}
                  onTemporaryStorageChange={temporary =>
                    this.handleTemporaryStorageChange(temporary)
                  }
                />
              </FlexItem>
            </Flex>
            <SamplesListGallery
              onCardClick={(devfileContent, stackName, optionalFilesContent) =>
                this.handleSampleCardClick(devfileContent, stackName, optionalFilesContent)
              }
              storageType={storageType}
            />
          </PageSection>
        </PageSection>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isLoading: selectIsLoading(state),
  workspacesSettings: selectWorkspacesSettings(state),
  preferredStorageType: selectPvcStrategy(state),
});

const connector = connect(mapStateToProps);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(SamplesListTab);
