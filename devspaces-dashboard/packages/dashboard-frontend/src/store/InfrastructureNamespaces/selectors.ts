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

import { createSelector } from 'reselect';

import { AppState } from '..';

const selectState = (state: AppState) => state.infrastructureNamespaces;

export const selectDefaultNamespace = createSelector(
  selectState,
  state =>
    state.namespaces.find(namespace => namespace.attributes.default === 'true') ||
    state.namespaces[0] ||
    ({} as che.KubernetesNamespace),
);

export const selectInfrastructureNamespaces = createSelector(
  selectState,
  state => state.namespaces,
);

export const selectInfrastructureNamespacesError = createSelector(
  selectState,
  state => state.error,
);
