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

import common from '@eclipse-che/common';
import axios from 'axios';
import { merge } from 'lodash';
import { Action, Reducer } from 'redux';

import { fetchBranding } from '@/services/assets/branding';
import { BRANDING_DEFAULT, BrandingData } from '@/services/bootstrap/branding.constant';
import { createObject } from '@/store/helpers';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export const ASSET_PREFIX = './assets/branding/';

export interface State {
  isLoading: boolean;
  data: BrandingData;
  error?: string;
}

export interface RequestBrandingAction extends Action, SanityCheckAction {
  type: 'REQUEST_BRANDING';
}

export interface ReceivedBrandingAction {
  type: 'RECEIVED_BRANDING';
  data: BrandingData;
}

export interface ReceivedBrandingErrorAction {
  type: 'RECEIVED_BRANDING_ERROR';
  error: string;
}

type KnownAction = RequestBrandingAction | ReceivedBrandingAction | ReceivedBrandingErrorAction;

export type ActionCreators = {
  requestBranding: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestBranding:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      const url = `${ASSET_PREFIX}product.json`;

      await dispatch({
        type: 'REQUEST_BRANDING',
        check: AUTHORIZED,
      });

      let branding: BrandingData;
      try {
        const receivedBranding = await fetchBranding(url);
        branding = getBrandingData(receivedBranding);
        dispatch({
          type: 'RECEIVED_BRANDING',
          data: branding,
        });
      } catch (e) {
        const errorMessage =
          `Failed to fetch branding data by URL: "${url}", reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVED_BRANDING_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }

      // Use the products version if specified in product.json, otherwise use the default version given by che server
      if (!branding.productVersion) {
        try {
          const apiInfo = await getApiInfo();
          branding.productVersion = apiInfo.implementationVersion;

          dispatch({
            type: 'RECEIVED_BRANDING',
            data: branding,
          });
        } catch (e) {
          const errorMessage =
            'OPTIONS request to "/api/" failed, reason: ' + common.helpers.errors.getMessage(e);
          dispatch({
            type: 'RECEIVED_BRANDING_ERROR',
            error: errorMessage,
          });
          throw errorMessage;
        }
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  data: getBrandingData(),
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_BRANDING':
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVED_BRANDING':
      return createObject<State>(state, {
        isLoading: false,
        data: action.data,
      });
    case 'RECEIVED_BRANDING_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};

async function getApiInfo(): Promise<{
  buildInfo: string;
  implementationVendor: string;
  implementationVersion: string;
  scmRevision: string;
  specificationTitle: string;
  specificationVendor: string;
  specificationVersion: string;
}> {
  try {
    const { data } = await axios.options('/api/');
    return data;
  } catch (e) {
    const errorMessage = common.helpers.errors.getMessage(e);
    throw new Error(errorMessage);
  }
}

function getBrandingData(receivedBranding?: { [key: string]: any }): BrandingData {
  let branding: BrandingData = Object.assign({}, BRANDING_DEFAULT);

  if (receivedBranding && Object.keys(receivedBranding).length > 0) {
    branding = merge(branding, receivedBranding);
  }
  // resolve asset paths
  const assetTitles: Array<keyof BrandingData> = ['logoFile', 'logoTextFile'];
  assetTitles.forEach((asset: string) => {
    const path = branding[asset] as string;
    if (path.startsWith(ASSET_PREFIX)) {
      return;
    }
    branding[asset] = ASSET_PREFIX + branding[asset];
  });

  return branding;
}
