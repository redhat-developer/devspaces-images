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

import { createSelector } from 'reselect';
import { AppState } from '../';
import match from '../../services/helpers/filter';

const selectState = (state: AppState) => state.devfileRegistries;

export const selectRegistriesMetadata = createSelector(
  selectState,
  state => {
    const registriesMetadata = Object.values(state.registries)
      .map(registryMetadata => registryMetadata.metadata || []);
    return mergeRegistriesMetadata(registriesMetadata);
  }
);

export const selectRegistriesErrors = createSelector(
  selectState,
  state => {
    const errors: Array<{ url: string, errorMessage: string }> = [];
    for (const [url, value] of Object.entries(state.registries)) {
      if (value.error) {
        errors.push({
          url,
          errorMessage: value.error,
        });
      }
    }
    return errors;
  }
);

export const selectFilterValue = createSelector(
  selectState,
  state => state.filter
);

export const selectMetadataFiltered = createSelector(
  selectState,
  selectFilterValue,
  selectRegistriesMetadata,
  (state, filterValue, metadata) => {
    if (!filterValue) {
      return metadata;
    }
    return metadata.filter(meta => matches(meta, filterValue));
  }
);

function matches(meta: che.DevfileMetaData, filterValue: string): boolean {
  return match(meta.displayName, filterValue)
    || match(meta.description || '', filterValue);
}

function mergeRegistriesMetadata(registriesMetadata: Array<Array<che.DevfileMetaData>>): Array<che.DevfileMetaData> {
  return registriesMetadata.reduce((mergedMetadata, registryMetadata) => {
    return mergedMetadata.concat(registryMetadata);
  }, []);
}

export const selectDevfileSchema = createSelector(
  selectState,
  state => state.schema.schema,
);

export const selectDevfileSchemaError = createSelector(
  selectState,
  state => state.schema.error,
);
