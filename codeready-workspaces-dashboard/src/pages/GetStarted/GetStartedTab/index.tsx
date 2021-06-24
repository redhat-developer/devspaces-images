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
import CheProgress from '../../../components/Progress';
import { SamplesListHeader } from './SamplesListHeader';
import SamplesListToolbar from './SamplesListToolbar';
import SamplesListGallery from './SamplesListGallery';
import { selectIsLoading } from '../../../store/Workspaces/selectors';
import { selectPreferredStorageType, selectWorkspacesSettings } from '../../../store/Workspaces/Settings/selectors';
import { load } from 'js-yaml';
import { updateDevfile } from '../../../services/storageTypes';
import stringify from '../../../services/helpers/editor';
import ImportFromGit from './ImportFromGit';
import { ResolverState } from '../../../store/FactoryResolver';

// At runtime, Redux will merge together...
type Props = {
  onDevfile: (devfileContent: string, stackName: string, optionalFilesContent?: {
    [fileName: string]: string
  }) => Promise<void>;
}
  & MappedProps;
type State = {
  temporary?: boolean;
  persistVolumesDefault: string;
};

export class SamplesListTab extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    const persistVolumesDefault = this.props.preferredStorageType === 'ephemeral' ? 'false'
      : this.props.workspacesSettings['che.workspace.persist_volumes.default'];

    this.state = {
      persistVolumesDefault
    };

  }

  private handleTemporaryStorageChange(temporary: boolean): void {
    this.setState({ temporary });
  }

  private handleSampleCardClick(devfileContent: string, stackName: string, optionalFilesContent?: { [fileName: string]: string }): Promise<void> {
    let devfile = load(devfileContent);

    if (this.state.temporary === undefined) {
      devfile = updateDevfile(devfile, this.props.preferredStorageType);
    } else if (this.props.preferredStorageType === 'async') {
      devfile = updateDevfile(devfile, this.state.temporary ? 'ephemeral' : this.props.preferredStorageType);
    } else {
      devfile = updateDevfile(devfile, this.state.temporary ? 'ephemeral' : 'persistent');
    }
    return this.props.onDevfile(stringify(devfile), stackName, optionalFilesContent);
  }

  private handleDevfileResolver(resolverState: ResolverState, stackName: string): Promise<void> {
    const devfile: che.WorkspaceDevfile = resolverState.devfile;
    const updatedDevfile = updateDevfile(devfile, this.props.preferredStorageType);
    const devfileContent = stringify(updatedDevfile);

    return this.props.onDevfile(devfileContent, stackName, resolverState.optionalFilesContent || {});
  }

  public render(): React.ReactElement {
    const isLoading = this.props.isLoading;

    return (
      <>
        <CheProgress isLoading={isLoading} />
        <PageSection
          variant={PageSectionVariants.default}
          style={{ background: '#f0f0f0' }}
        >
          <PageSection variant={PageSectionVariants.light}>
            <ImportFromGit
              onDevfileResolve={(resolverState, location) => this.handleDevfileResolver(resolverState, location)}
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
                <SamplesListToolbar persistVolumesDefault={this.state.persistVolumesDefault}
                  onTemporaryStorageChange={temporary => this.handleTemporaryStorageChange(temporary)} />
              </FlexItem>
            </Flex>
            <SamplesListGallery
              onCardClick={(devfileContent, stackName, optionalFilesContent) => this.handleSampleCardClick(devfileContent, stackName, optionalFilesContent)} />
          </PageSection>
        </PageSection>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isLoading: selectIsLoading(state),
  workspacesSettings: selectWorkspacesSettings(state),
  preferredStorageType: selectPreferredStorageType(state),
});

const connector = connect(
  mapStateToProps
);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(SamplesListTab);
