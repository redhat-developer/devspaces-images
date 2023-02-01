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

const PROJECT_NAME_MAX_LENGTH = 63;

export function getProjectName(cloneUrl: string): string {
  let name = cloneUrl
    .split('/')
    .reverse()[0]
    .replace(/(?:\.git)$/, '');
  name = name.toLowerCase();
  name = name.replace(/([^-a-z0-9]+)/g, '-');
  name = name.replace(/(^[-]+)/, '');
  name = name.replace(/([-]+$)/, '');
  if (name.length > PROJECT_NAME_MAX_LENGTH) {
    name = name.substr(0, PROJECT_NAME_MAX_LENGTH - 1);
  }

  return name;
}
