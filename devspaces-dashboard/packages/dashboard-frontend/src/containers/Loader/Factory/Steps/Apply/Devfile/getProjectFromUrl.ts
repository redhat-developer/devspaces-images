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

import { V220DevfileProjects } from '@devfile/api';
import { getProjectName } from '../../../../../../services/helpers/getProjectName';

export function getProjectFromUrl(url: string, remoteName = 'origin'): V220DevfileProjects {
  const sourceUrl = new URL(url);
  const name = getProjectName(url);
  if (sourceUrl.pathname.endsWith('.git')) {
    const origin = `${sourceUrl.origin}${sourceUrl.pathname}`;
    return { git: { remotes: { [remoteName]: origin } }, name };
  } else {
    const sources = sourceUrl.pathname.split('/tree/');
    const origin = `${sourceUrl.origin}${sources[0]}.git`;
    const revision = sources[1];

    if (revision) {
      return {
        git: { remotes: { [remoteName]: origin }, checkoutFrom: { revision } },
        name,
      };
    } else {
      return {
        git: { remotes: { [remoteName]: origin } },
        name,
      };
    }
  }
}
