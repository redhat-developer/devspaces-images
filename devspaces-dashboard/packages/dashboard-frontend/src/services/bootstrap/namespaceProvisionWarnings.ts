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

import { container } from '@/inversify.config';
import { WarningsReporterService } from '@/services/bootstrap/warningsReporter';
import { AppState } from '@/store';
import { selectAdvancedAuthorization, selectAutoProvision } from '@/store/ServerConfig/selectors';

const warningsReporterService = container.get(WarningsReporterService);

export function checkNamespaceProvisionWarnings(getState: () => AppState): void {
  const state = getState();
  const autoProvision = selectAutoProvision(state);
  if (autoProvision === false) {
    warningsReporterService.registerWarning(
      'autoProvisionWarning',
      `Automatic namespace provisioning is disabled. Namespace might not have been configured yet. Please, contact the administrator.`,
    );
  }

  const advancedAuthorization = selectAdvancedAuthorization(state);
  if (advancedAuthorization === undefined || Object.keys(advancedAuthorization).length === 0) {
    return;
  }
  if (advancedAuthorization.allowGroups || advancedAuthorization.denyGroups) {
    warningsReporterService.registerWarning(
      'advancedAuthorizationGroupsWarning',
      `Advanced authorization is enabled. User might not be allowed. Please, contact the administrator.`,
    );
  }
  if (advancedAuthorization.allowUsers || advancedAuthorization.denyUsers) {
    warningsReporterService.registerWarning(
      'advancedAuthorizationUsersWarning',
      `Advanced authorization is enabled. User might not be allowed. Please, contact the administrator.`,
    );
  }
}
