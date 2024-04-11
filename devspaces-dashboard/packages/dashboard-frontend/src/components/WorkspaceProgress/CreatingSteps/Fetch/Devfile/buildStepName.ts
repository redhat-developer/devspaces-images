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

import { FactoryResolverStateResolver } from '@/store/FactoryResolver';

export function buildStepName(
  sourceUrl: string,
  factoryResolver: FactoryResolverStateResolver,
): string {
  // source tells where devfile comes from
  //  - no source: the url to raw content is used
  //  - repo: means no devfile is found and default is generated
  //  - any other - devfile is found in repository as filename from the value
  const { devfile, source } = factoryResolver;

  const devfileName =
    devfile.metadata.name !== undefined
      ? `name "${devfile.metadata.name}"`
      : `generateName "${devfile.metadata.generateName}"`;
  let newTitle = '';

  if (!source) {
    newTitle += `Devfile found with ${devfileName}.`;
  } else if (source === 'repo') {
    newTitle = `Devfile could not be found in ${sourceUrl}. Applying the default configuration.`;
  } else {
    newTitle = `Devfile found with ${devfileName}.`;
  }
  return newTitle;
}
