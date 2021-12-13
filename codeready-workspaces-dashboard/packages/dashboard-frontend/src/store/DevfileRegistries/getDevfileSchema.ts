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

export default async function getDevfileSchema(
  apiCallback: (schemaVersion: string) => Promise<JSONSchema7>,
  schemaVersion: string,
): Promise<JSONSchema7> {
  const schema = await apiCallback(schemaVersion);

  if (
    typeof schema?.properties?.schemaVersion === 'object' &&
    schema.properties.schemaVersion.const === undefined
  ) {
    schema.properties.schemaVersion.const = schemaVersion;
  }

  return schema;
}
