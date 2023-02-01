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

import { IDevWorkspaceTemplate } from '../devworkspaceClient';
import { V1alpha2DevWorkspace } from '@devfile/api';

declare namespace restParams {
  export interface INamespacedParams {
    namespace: string;
  }

  export interface IDockerConfigParams {
    dockerconfig: string;
    resourceVersion?: string;
  }

  export interface INamespacedWorkspaceParams extends INamespacedParams {
    workspaceName: string;
  }

  export interface INamespacedTemplateParams extends INamespacedParams {
    templateName: string;
  }

  export interface INamespacedPodParams extends INamespacedParams {
    devworkspaceId: string;
  }

  export interface ISchemaParams {
    [key: string]: any;
  }

  export interface ITemplateBodyParams {
    template: IDevWorkspaceTemplate;
  }

  export interface IDevWorkspaceSpecParams {
    devworkspace: V1alpha2DevWorkspace;
  }

  export interface IDevfileVersionParams {
    version: string;
  }

  export interface IYamlResolverParams {
    url: string;
  }
}

declare module 'restParams' {
  export = restParams;
}
