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

import { IDevWorkspaceTemplate } from '../devworkspace-client';

declare namespace restParams {

  export interface INamespacedParam {
    namespace: string;
  }

  export interface INamespacedWorkspaceParam extends INamespacedParam {
    workspaceName: string;
  }

  export interface IStatusUpdate {
    error?: string;
    message?: string;
    status?: string;
    prevStatus?: string;
    workspaceId: string;
  }

  export interface ISchemaParams {
    [key: string]: any;
  }

  export interface ITemplateBodyParam {
    template: IDevWorkspaceTemplate;
  }

  export interface IDevWorkspaceSpecParam {
    devworkspace: IDevWorkspace;
  }
}

declare module 'restParams' {
  export = restParams;
}
