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
import { ConnectedProps, connect } from 'react-redux';
import { AppState } from '../../store';
import { selectRegistriesErrors, selectDevfileSchemaError } from '../../store/DevfileRegistries/selectors';
import { selectPluginsError } from '../../store/Plugins/chePlugins/selectors';
import { selectDwPluginsError } from '../../store/Plugins/devWorkspacePlugins/selectors';
import { selectInfrastructureNamespacesError } from '../../store/InfrastructureNamespaces/selectors';
import { selectUserProfileError } from '../../store/UserProfile/selectors';
import { selectWorkspacesSettingsError } from '../../store/Workspaces/Settings/selectors';
import { selectWorkspacesError } from '../../store/Workspaces/selectors';
import { selectUserError } from '../../store/User/selectors';
import { AlertVariant } from '@patternfly/react-core';
import { lazyInject } from '../../inversify.config';
import { AppAlerts } from '../../services/alerts/appAlerts';

type Props = MappedProps;

export class PreloadIssuesAlert extends React.PureComponent<Props> {

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  public componentDidMount(): void {
    // workspaces errors
    if (this.props.workspacesError) {
      this.appAlerts.showAlert({
        key: 'workspaces-error',
        title: this.props.workspacesError,
        variant: AlertVariant.danger,
      });
    }
    // devfile registries errors
    if (this.props.registriesErrors.length > 0) {
      this.props.registriesErrors.forEach(error => {
        this.appAlerts.showAlert({
          key: 'registry-error-' + error.url,
          title: error.errorMessage,
          variant: AlertVariant.danger,
        });
      });
    }
    // user info error
    if (this.props.userError) {
      this.appAlerts.showAlert({
        key: 'user-error',
        title: this.props.userError,
        variant: AlertVariant.danger,
      });
    }
    // plugins error
    if (this.props.pluginsError) {
      this.appAlerts.showAlert({
        key: 'plugins-error',
        title: this.props.pluginsError,
        variant: AlertVariant.danger,
      });
    }
    // devWorkspace plugins error
    if (this.props.dwPluginsError) {
      this.appAlerts.showAlert({
        key: 'dw-plugins-error',
        title: this.props.dwPluginsError,
        variant: AlertVariant.danger,
      });
    }
    // infrastructure namespace error
    if (this.props.infrastructureNamespacesError) {
      this.appAlerts.showAlert({
        key: 'infrastructure-namespaces-error',
        title: this.props.infrastructureNamespacesError,
        variant: AlertVariant.danger,
      });
    }
    // devfile schema error
    if (this.props.devfileSchemaError) {
      this.appAlerts.showAlert({
        key: 'devfile-schema-error',
        title: this.props.devfileSchemaError,
        variant: AlertVariant.danger,
      });
    }
    // user profile error
    if (this.props.userProfileError) {
      this.appAlerts.showAlert({
        key: 'user-profile-error',
        title: this.props.userProfileError,
        variant: AlertVariant.danger,
      });
    }
    // workspaces settings error
    if (this.props.workspacesSettingsError) {
      this.appAlerts.showAlert({
        key: 'workspace-settings-error',
        title: this.props.workspacesSettingsError,
        variant: AlertVariant.danger,
      });
    }
  }

  render() {
    return '';
  }

}

const mapStateToProps = (state: AppState) => ({
  userError: selectUserError(state),
  registriesErrors: selectRegistriesErrors(state),
  pluginsError: selectPluginsError(state),
  dwPluginsError: selectDwPluginsError(state),
  infrastructureNamespacesError: selectInfrastructureNamespacesError(state),
  devfileSchemaError: selectDevfileSchemaError(state),
  userProfileError: selectUserProfileError(state),
  workspacesSettingsError: selectWorkspacesSettingsError(state),
  workspacesError: selectWorkspacesError(state),
});

const connector = connect(
  mapStateToProps
);

type MappedProps = ConnectedProps<typeof connector>
export default connector(PreloadIssuesAlert);

