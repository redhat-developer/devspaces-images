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

import { load } from 'js-yaml';
import { createSelector } from 'reselect';

import devfileApi from '@/services/devfileApi';
import match from '@/services/helpers/filter';
import { selectDefaultComponents } from '@/store/ServerConfig/selectors';

import { AppState } from '..';

export const EMPTY_WORKSPACE_TAG = 'Empty';

const selectState = (state: AppState) => state.devfileRegistries;

export const selectRegistriesMetadata = createSelector(selectState, devfileRegistriesState => {
  const registriesMetadata = Object.keys(devfileRegistriesState.registries).map(registry => {
    const metadata = devfileRegistriesState.registries[registry].metadata || [];
    return metadata.map(meta => Object.assign({ registry }, meta));
  });
  const metadata = mergeRegistriesMetadata(registriesMetadata);
  return filterDevfileV2Metadata(metadata);
});

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

export const selectEmptyWorkspaceUrl = createSelector(
  selectState,
  selectRegistriesMetadata,
  (state, metadata) => {
    const v2Metadata = filterDevfileV2Metadata(metadata);
    const emptyWorkspaceMetadata = v2Metadata.find(meta => meta.tags.includes(EMPTY_WORKSPACE_TAG));
    return emptyWorkspaceMetadata?.links?.v2;
  },
);

export const selectDefaultDevfile = createSelector(
  selectState,
  selectDefaultComponents,
  selectEmptyWorkspaceUrl,
  (state, defaultComponents, devfileLocation) => {
    if (!devfileLocation) {
      return undefined;
    }
    const devfileContent = state.devfiles[devfileLocation]?.content;
    if (devfileContent) {
      try {
        const devfile = load(devfileContent) as devfileApi.Devfile;
        // propagate default components
        if (!devfile.components || devfile.components.length === 0) {
          devfile.components = defaultComponents;
        }
        return devfile;
      } catch (e) {
        console.error(e);
      }
    }
    return undefined;
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

export const selectDevWorkspaceResources = createSelector(
  selectState,
  state => state.devWorkspaceResources,
);
