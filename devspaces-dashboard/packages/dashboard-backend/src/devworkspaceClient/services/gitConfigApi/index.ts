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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import * as ini from 'multi-ini';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IGitConfigApi } from '@/devworkspaceClient/types';

const GITCONFIG_CONFIGMAP = 'workspace-userdata-gitconfig-configmap';
const GITCONFIG_API_ERROR_LABEL = 'CORE_V1_API_ERROR';

export class GitConfigApiService implements IGitConfigApi {
  private readonly coreV1API: CoreV1API;

  constructor(kc: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kc);
  }

  /**
   * @throws
   * Reads `gitconfig` from the given `namespace`.
   */
  public async read(namespace: string): Promise<api.IGitConfig> {
    try {
      const response = await this.coreV1API.readNamespacedConfigMap(GITCONFIG_CONFIGMAP, namespace);

      return this.toGitConfig(response.body);
    } catch (error) {
      const message = `Unable to read gitconfig in the namespace "${namespace}"`;
      throw createError(error, GITCONFIG_API_ERROR_LABEL, message);
    }
  }

  /**
   * @throws
   * Updates `gitconfig` in the given `namespace` with `changedGitConfig`.
   */
  public async patch(namespace: string, changedGitConfig: api.IGitConfig): Promise<api.IGitConfig> {
    let gitConfig: api.IGitConfig;
    try {
      gitConfig = await this.read(namespace);
    } catch (error) {
      const message = `Unable to update gitconfig in the namespace "${namespace}"`;
      throw createError(undefined, GITCONFIG_API_ERROR_LABEL, message);
    }

    if (
      parseInt(gitConfig.resourceVersion || '0', 10) >
      parseInt(changedGitConfig.resourceVersion || '0', 10)
    ) {
      const message = `Conflict detected. The gitconfig was modified in the namespace "${namespace}"`;
      throw createError(undefined, GITCONFIG_API_ERROR_LABEL, message);
    }

    gitConfig.gitconfig = changedGitConfig.gitconfig;

    try {
      const gitconfigStr = this.fromGitConfig(gitConfig);
      const response = await this.coreV1API.patchNamespacedConfigMap(
        GITCONFIG_CONFIGMAP,
        namespace,
        {
          data: {
            gitconfig: gitconfigStr,
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            'content-type': k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH,
          },
        },
      );

      return this.toGitConfig(response.body);
    } catch (error) {
      const message = `Unable to update gitconfig in the namespace "${namespace}"`;
      throw createError(error, GITCONFIG_API_ERROR_LABEL, message);
    }
  }

  /**
   * @throws
   * Serializes `gitConfig` object.
   */
  private fromGitConfig(gitConfig: api.IGitConfig): string {
    const serializer = new ini.Serializer();
    const gitconfigStr = serializer.serialize(gitConfig.gitconfig);
    return gitconfigStr;
  }

  /**
   * @throws
   * Extracts `resourceVersion` and `data.gitconfig` from given `ConfigMap`.
   */
  private toGitConfig(configMapBody: k8s.V1ConfigMap): api.IGitConfig {
    const resourceVersion = configMapBody.metadata?.resourceVersion;
    const gitconfigStr = configMapBody.data?.gitconfig;

    const parser = new ini.Parser();

    if (typeof gitconfigStr !== 'string') {
      throw new Error('Unexpected data type');
    }

    const gitconfigLines = gitconfigStr.split(/\r?\n/);

    const gitconfig = parser.parse(gitconfigLines);
    if (!isGitConfig(gitconfig)) {
      throw new Error('Gitconfig is empty.');
    }

    return {
      resourceVersion,
      gitconfig,
    };
  }
}

type GitConfig = api.IGitConfig['gitconfig'];
/**
 * Checks if given object is a valid `GitConfig`.
 */
function isGitConfig(gitConfig: unknown): gitConfig is GitConfig {
  return (
    (gitConfig as GitConfig).user !== undefined &&
    (gitConfig as GitConfig).user.email !== undefined &&
    (gitConfig as GitConfig).user.name !== undefined
  );
}
