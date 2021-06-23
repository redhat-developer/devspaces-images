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
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';
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

// At runtime, Redux will merge together...
type Props = {
  onDevfile: (devfileContent: string, stackName: string) => Promise<void>;
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

  private handleSampleCardClick(devfileContent: string, stackName: string): Promise<void> {
    let devfile = load(devfileContent);

    if (this.state.temporary === undefined) {
      devfile = updateDevfile(devfile, this.props.preferredStorageType);
    } else if (this.props.preferredStorageType === 'async') {
      devfile = updateDevfile(devfile, this.state.temporary ? 'ephemeral' : this.props.preferredStorageType);
    } else {
      devfile = updateDevfile(devfile, this.state.temporary ? 'ephemeral' : 'persistent');
    }
    return this.props.onDevfile(stringify(devfile), stackName);
  }

  public render(): React.ReactElement {
    const isLoading = this.props.isLoading;

    return (
      <React.Fragment>
        <PageSection
          variant={PageSectionVariants.light}>
          <SamplesListHeader />
          <SamplesListToolbar
            persistVolumesDefault={this.state.persistVolumesDefault}
            onTemporaryStorageChange={temporary => this.handleTemporaryStorageChange(temporary)} />
        </PageSection>
        <CheProgress isLoading={isLoading} />
        <PageSection variant={PageSectionVariants.default} style={{ background: '#f0f0f0' }}>
          <SamplesListGallery onCardClick={(devfileContent, stackName) => this.handleSampleCardClick(devfileContent, stackName)} />
        </PageSection>
      </React.Fragment>
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
