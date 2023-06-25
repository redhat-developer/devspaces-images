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

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { LoaderPage } from '../../pages/Loader';
import { findTargetWorkspace } from '../../services/helpers/factoryFlow/findTargetWorkspace';
import { getLoaderMode, LoaderMode } from '../../services/helpers/factoryFlow/getLoaderMode';
import { sanitizeLocation } from '../../services/helpers/location';
import { LoaderTab } from '../../services/helpers/types';
import { Workspace } from '../../services/workspace-adapter';
import { AppState } from '../../store';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';

export type Props = MappedProps & RouteComponentProps;
export type State = {
  loaderMode: LoaderMode;
  searchParams: URLSearchParams;
  tabParam: string | undefined;
};

class LoaderContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { location: dirtyLocation } = this.props.history;
    const { search } = sanitizeLocation(dirtyLocation);
    const searchParams = new URLSearchParams(search);
    const tabParam = searchParams.get('tab') || undefined;

    const loaderMode = getLoaderMode(props.history.location);

    this.state = {
      loaderMode,
      searchParams,
      tabParam,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    // check if the location has changed
    // if so, update the loader mode
    if (prevProps.history.location !== this.props.history.location) {
      const loaderMode = getLoaderMode(this.props.history.location);
      this.setState({
        loaderMode,
      });
    }
  }

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    if (state.loaderMode.mode !== 'workspace') {
      return;
    }
    return findTargetWorkspace(props.allWorkspaces, state.loaderMode.workspaceParams);
  }

  private handleTabChange(tab: LoaderTab): void {
    this.setState({
      tabParam: tab,
    });

    const { location } = this.props.history;
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', LoaderTab[tab]);
    location.search = searchParams.toString();
    this.props.history.push(location);
  }

  render(): React.ReactElement {
    const { history } = this.props;
    const { tabParam, searchParams } = this.state;

    const workspace = this.findTargetWorkspace(this.props, this.state);

    return (
      <LoaderPage
        history={history}
        tabParam={tabParam}
        searchParams={searchParams}
        workspace={workspace}
        onTabChange={tab => this.handleTabChange(tab)}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps, null, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(LoaderContainer);
