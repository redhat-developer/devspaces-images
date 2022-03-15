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

import { JSONSchema7 } from 'json-schema';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';

export default async function fetchAndUpdateDevfileSchema(
  workspaceClient: CheWorkspaceClient,
  schemaVersion: string,
): Promise<JSONSchema7> {
  const schema = await workspaceClient.restApiClient.getDevfileSchema<JSONSchema7>(schemaVersion);

  if (
    typeof schema?.properties?.schemaVersion === 'object' &&
    schema.properties.schemaVersion.const === undefined
  ) {
    schema.properties.schemaVersion.const = schemaVersion;
  }

  return schema;
}
