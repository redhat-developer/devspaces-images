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

import { createSelector } from 'reselect';
import { AppState } from '..';
import match from '../../services/helpers/filter';
import { selectWorkspacesSettingsState } from '../Workspaces/Settings/selectors';
import { isDevworkspacesEnabled } from '../../services/helpers/devworkspace';

const selectState = (state: AppState) => state.devfileRegistries;

export const selectRegistriesMetadata = createSelector(
  selectState,
  selectWorkspacesSettingsState,
  (devfileRegistriesState, workspacesSettingsState) => {
    const registriesMetadata = Object.keys(devfileRegistriesState.registries).map(registry => {
      const metadata = devfileRegistriesState.registries[registry].metadata || [];
      return metadata.map(meta => Object.assign({ registry }, meta));
    });
    const metadata = mergeRegistriesMetadata(registriesMetadata);
    const cheDevworkspaceEnabled = isDevworkspacesEnabled(workspacesSettingsState.settings);
    if (cheDevworkspaceEnabled) {
      return filterDevfileV2Metadata(metadata);
    } else {
      return metadata;
    }
  },
);

export const selectRegistriesErrors = createSelector(selectState, state => {
  const errors: Array<{ url: string; errorMessage: string }> = [];
  for (const [url, value] of Object.entries(state.registries)) {
    if (value.error) {
      errors.push({
        url,
        errorMessage: value.error,
      });
    }
  }
  return errors;
});

export const selectFilterValue = createSelector(selectState, state => state.filter);

export const selectMetadataFiltered = createSelector(
  selectState,
  selectFilterValue,
  selectRegistriesMetadata,
  (state, filterValue, metadata) => {
    if (!filterValue) {
      return metadata;
    }
    return metadata.filter(meta => matches(meta, filterValue));
  },
);

function matches(meta: che.DevfileMetaData, filterValue: string): boolean {
  return match(meta.displayName, filterValue) || match(meta.description || '', filterValue);
}

function mergeRegistriesMetadata(
  registriesMetadata: Array<Array<che.DevfileMetaData>>,
): Array<che.DevfileMetaData> {
  return registriesMetadata.reduce((mergedMetadata, registryMetadata) => {
    return mergedMetadata.concat(registryMetadata);
  }, []);
}

function filterDevfileV2Metadata(metadata: Array<che.DevfileMetaData>): Array<che.DevfileMetaData> {
  return metadata.filter(metadata => metadata.links?.v2);
}

export const selectDevfileSchema = createSelector(selectState, state => state.schema.schema);

export const selectDevfileSchemaError = createSelector(selectState, state => state.schema.error);
