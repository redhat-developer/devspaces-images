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

export { che as api } from '@eclipse-che/api';

export type WorkspaceStorageType =
  | 'async'
  | 'ephemeral'
  | 'persistent'
  | 'per-workspace'
  | 'per-user'
  | 'common'
  | '';

export interface Plugin {
  id: string;
  name: string;
  publisher: string;
  displayName?: string;
  type: string;
  version: string;
  description?: string;
  links: {
    devfile: string;
  };
  icon: string;
}

export interface WorkspaceDevfileAttributes {
  [key: string]: string;
}

export interface DevfileMetaData {
  displayName: string;
  description?: string;
  globalMemoryLimit?: string;
  registry?: string;
  icon: string | { base64data: string; mediatype: string };
  links: {
    v2?: string;
    devWorkspaces?: {
      [editorId: string]: string;
    };
    self?: string;
    [key: string]: any;
  };
  url?: string;
  tags: Array<string>;
}

export interface KubernetesNamespace {
  name: string;
  attributes: {
    default?: 'true' | 'false';
    displayName?: string;
    phase: string;
  };
}
