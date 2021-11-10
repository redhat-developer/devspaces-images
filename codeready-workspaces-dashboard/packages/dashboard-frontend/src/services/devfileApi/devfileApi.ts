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

export { Devfile, DevfileLike } from './devfile';

export { DevfileMetadata } from './devfile/metadata';

export { DevWorkspace, DevWorkspaceKind, DevWorkspaceLike } from './devWorkspace';

export { DevWorkspaceSpec } from './devWorkspace/spec';

export { DevWorkspaceMetadata } from './devWorkspace/metadata';

export { DevWorkspaceTemplate, DevWorkspaceTemplateLike } from './devWorkspace/template';

export { DevWorkspaceTemplateMetadata } from './devWorkspace/template/metadata';

export {
  V1alpha2DevWorkspaceStatus as DevWorkspaceStatus,
  V1alpha2DevWorkspaceSpecTemplate as DevWorkspaceSpecTemplate,
} from '@devfile/api';
