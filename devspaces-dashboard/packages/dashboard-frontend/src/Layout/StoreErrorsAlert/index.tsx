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

import { AlertVariant } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import { selectRegistriesErrors } from '@/store/DevfileRegistries/selectors';
import { selectInfrastructureNamespacesError } from '@/store/InfrastructureNamespaces/selectors';
import { selectPluginsError } from '@/store/Plugins/chePlugins/selectors';
import { selectDwDefaultEditorError } from '@/store/Plugins/devWorkspacePlugins/selectors';
import { selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { selectUserProfileError } from '@/store/User/Profile/selectors';
import { selectWorkspacesError } from '@/store/Workspaces/selectors';

type Props = MappedProps;

export class StoreErrorsAlert extends React.PureComponent<Props> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  public componentDidUpdate(prevProps: Props) {
    // sanity check error
    if (this.props.sanityCheckError && prevProps.sanityCheckError === undefined) {
      this.appAlerts.showAlert({
        key: 'authorization-error',
        title: this.props.sanityCheckError,
        variant: AlertVariant.danger,
        timeout: false,
      });
      // do not show other errors if any
      return;
    }
  }

  public componentDidMount(): void {
    // sanity check error
    if (this.props.sanityCheckError) {
      this.appAlerts.showAlert({
        key: 'authorization-error',
        title: this.props.sanityCheckError,
        variant: AlertVariant.danger,
        timeout: false,
      });
      // do not show other errors if any
      return;
    }

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
    // plugins error
    if (this.props.pluginsError) {
      this.appAlerts.showAlert({
        key: 'plugins-error',
        title: this.props.pluginsError,
        variant: AlertVariant.danger,
      });
    }
    // devWorkspace default editor error
    if (this.props.dwDefaultEditorError) {
      this.appAlerts.showAlert({
        key: 'dw-plugins-error',
        title: this.props.dwDefaultEditorError,
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
    // user profile error
    if (this.props.userProfileError) {
      this.appAlerts.showAlert({
        key: 'user-profile-error',
        title: this.props.userProfileError,
        variant: AlertVariant.danger,
      });
    }
  }

  render() {
    return '';
  }
}

const mapStateToProps = (state: AppState) => ({
  registriesErrors: selectRegistriesErrors(state),
  pluginsError: selectPluginsError(state),
  sanityCheckError: selectSanityCheckError(state),
  dwDefaultEditorError: selectDwDefaultEditorError(state),
  infrastructureNamespacesError: selectInfrastructureNamespacesError(state),
  userProfileError: selectUserProfileError(state),
  workspacesError: selectWorkspacesError(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(StoreErrorsAlert);
