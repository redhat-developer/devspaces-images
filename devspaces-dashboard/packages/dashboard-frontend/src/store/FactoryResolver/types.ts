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

import { Action } from 'redux';

import devfileApi from '@/services/devfileApi';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { FactoryResolver } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { SanityCheckAction } from '@/store/sanityCheckMiddleware';

export interface Resolver extends FactoryResolver {
  devfile: devfileApi.Devfile;
  optionalFilesContent?: {
    [fileName: string]: string;
  };
}

export interface State {
  isLoading: boolean;
  resolver?: Resolver;
  error?: string;
}

export type OAuthResponse = {
  attributes: {
    oauth_provider: string;
    oauth_version: string;
    oauth_authentication_url: string;
  };
  errorCode: number;
  message: string | undefined;
};

export enum Type {
  REQUEST_FACTORY_RESOLVER = 'REQUEST_FACTORY_RESOLVER',
  RECEIVE_FACTORY_RESOLVER = 'RECEIVE_FACTORY_RESOLVER',
  RECEIVE_FACTORY_RESOLVER_ERROR = 'RECEIVE_FACTORY_RESOLVER_ERROR',
}

interface RequestFactoryResolverAction extends Action, SanityCheckAction {
  type: Type.REQUEST_FACTORY_RESOLVER;
}
interface ReceiveFactoryResolverAction {
  type: Type.RECEIVE_FACTORY_RESOLVER;
  resolver: Resolver;
}
interface ReceiveFactoryResolverErrorAction {
  type: Type.RECEIVE_FACTORY_RESOLVER_ERROR;
  error: string | undefined;
}

export type KnownAction =
  | RequestFactoryResolverAction
  | ReceiveFactoryResolverAction
  | ReceiveFactoryResolverErrorAction;

export type ActionCreators = {
  requestFactoryResolver: (
    location: string,
    factoryParams: Partial<FactoryParams>,
  ) => AppThunk<KnownAction, Promise<void>>;
};
