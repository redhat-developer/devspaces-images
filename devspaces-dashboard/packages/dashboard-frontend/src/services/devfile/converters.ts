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

import * as devfileConverter from '@eclipse-che/devfile-converter';

import devfileApi from '@/services/devfileApi';

export async function convertDevfileV2toDevfileV1(
  devfile: devfileApi.Devfile,
  optionalFilesContent:
    | {
        [fileName: string]: string;
      }
    | undefined,
): Promise<che.WorkspaceDevfile> {
  const externalAccess = async function (file: string): Promise<string> {
    return optionalFilesContent?.[file] || '';
  };
  return (await devfileConverter.v2ToV1(devfile, externalAccess)) as che.WorkspaceDevfile;
}

export async function convertDevfileV1toDevfileV2(
  devfile: che.WorkspaceDevfile,
): Promise<devfileApi.Devfile> {
  const converted = (await devfileConverter.v1ToV2(devfile)) as devfileApi.Devfile;

  if (converted.components?.some(component => component.container?.image)) {
    return converted;
  }

  // if no user component found
  // use `mergeImage` sidecar policy
  const sidecarPolicyKey = 'che-theia.eclipse.org/sidecar-policy';
  const sidecarPolicy = 'mergeImage';
  if (converted.attributes === undefined) {
    converted.attributes = {};
  }
  if (converted.attributes?.[sidecarPolicyKey] === undefined) {
    converted.attributes[sidecarPolicyKey] = sidecarPolicy;
  }

  return converted;
}
