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

import { V221DevfileProjects } from '@devfile/api';

import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import { getProjectName } from '@/services/helpers/getProjectName';

export function getProjectFromLocation(
  location: string,
  remoteName = 'origin',
): V221DevfileProjects {
  const name = getProjectName(location);
  if (FactoryLocationAdapter.isSshLocation(location)) {
    const origin = location;
    return {
      git: { remotes: { [remoteName]: origin } },
      name,
    };
  } else if (FactoryLocationAdapter.isHttpLocation(location)) {
    const sourceUrl = new URL(location);
    if (sourceUrl.pathname.endsWith('.git')) {
      const origin = `${sourceUrl.origin}${sourceUrl.pathname}`;
      return { git: { remotes: { [remoteName]: origin } }, name };
    } else {
      const sources = sourceUrl.pathname.split('/tree/');
      const origin = `${sourceUrl.origin}${sources[0].replace(new RegExp('/$'), '')}.git`;
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
  throw new Error(`Failed to get project from location: '${location}'.`);
}
