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

import {
  IDevWorkspaceApi,
  IDevWorkspaceTemplateApi,
  IDockerConfigApi,
  IEventApi,
  IGettingStartedSampleApi,
  IGitConfigApi,
  IKubeConfigApi,
  ILogsApi,
  IPersonalAccessTokenApi,
  IPodApi,
  IServerConfigApi,
  IShhKeysApi,
  IUserProfileApi,
} from '@/devworkspaceClient/types';

import { IDevWorkspaceClient } from '..';

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
  get userProfileApi(): IUserProfileApi {
    throw new Error('Method not implemented.');
  }
  get logsApi(): ILogsApi {
    throw new Error('Method not implemented.');
  }
  get personalAccessTokenApi(): IPersonalAccessTokenApi {
    throw new Error('Method not implemented.');
  }
  get podApi(): IPodApi {
    throw new Error('Method not implemented.');
  }
  get gettingStartedSampleApi(): IGettingStartedSampleApi {
    throw new Error('Method not implemented.');
  }
  get gitConfigApi(): IGitConfigApi {
    throw new Error('Method not implemented.');
  }
  get sshKeysApi(): IShhKeysApi {
    throw new Error('Method not implemented.');
  }
}
