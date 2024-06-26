/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import { selectAutoProvision } from '@/store/ServerConfig/selectors';

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
}
