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

import { IDevWorkspaceClient } from '..';
import {
  IDevWorkspaceApi,
  IDevWorkspaceTemplateApi,
  IDockerConfigApi,
  IEventApi,
  IKubeConfigApi,
  INamespaceApi,
  IServerConfigApi,
  IUserProfileApi,
} from '../types';

export class DevWorkspaceClient implements IDevWorkspaceClient {
  get eventApi(): IEventApi {
    throw new Error('Method not implemented.');
  }
  get devworkspaceApi(): IDevWorkspaceApi {
    throw new Error('Method not implemented.');
  }
  get devWorkspaceTemplateApi(): IDevWorkspaceTemplateApi {
    throw new Error('Method not implemented.');
  }
  get dockerConfigApi(): IDockerConfigApi {
    throw new Error('Method not implemented.');
  }
  get serverConfigApi(): IServerConfigApi {
    throw new Error('Method not implemented.');
  }
  get kubeConfigApi(): IKubeConfigApi {
    throw new Error('Method not implemented.');
  }
  get namespaceApi(): INamespaceApi {
    throw new Error('Method not implemented.');
  }
  get userProfileApi(): IUserProfileApi {
    throw new Error('Method not implemented.');
  }
}
