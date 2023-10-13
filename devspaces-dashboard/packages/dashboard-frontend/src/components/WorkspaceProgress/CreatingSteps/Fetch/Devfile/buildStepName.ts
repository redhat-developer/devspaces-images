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

import * as FactoryResolverStore from '@/store/FactoryResolver';

export function buildStepName(
  sourceUrl: string,
  factoryResolver: FactoryResolverStore.ResolverState,
  factoryResolverConverted: FactoryResolverStore.ConvertedState,
): string {
  // source tells where devfile comes from
  //  - no source: the url to raw content is used
  //  - repo: means no devfile is found and default is generated
  //  - any other - devfile is found in repository as filename from the value
  const { source } = factoryResolver;
  const { devfileV2 } = factoryResolverConverted;

  const devfileName =
    devfileV2.metadata.name !== undefined
      ? `name "${devfileV2.metadata.name}"`
      : `generateName "${devfileV2.metadata.generateName}"`;
  let newTitle = '';

  if (!source) {
    newTitle += `Devfile found with ${devfileName}.`;
  } else if (source === 'repo') {
    newTitle = `Devfile could not be found in ${sourceUrl}. Applying the default configuration.`;
  } else {
    newTitle = `Devfile found with ${devfileName}.`;
    if (factoryResolverConverted.isConverted) {
      newTitle += ` Devfile version 1 found, converting it to devfile version 2.`;
    }
  }
  return newTitle;
}
