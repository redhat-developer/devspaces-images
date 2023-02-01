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

import { helpers } from '@eclipse-che/common';

class DevWorkspaceClientError extends Error {
  statusCode: number;

  constructor(message: string, name: string, statusCode: number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export function createError(
  error: unknown,
  name: string,
  additionalMessage: string,
): DevWorkspaceClientError {
  const statusCode: number =
    helpers.errors.isKubeClientError(error) && error.statusCode ? error.statusCode : 500;

  if (error === undefined) {
    return new DevWorkspaceClientError(`${additionalMessage}.`, name, statusCode);
  }

  const originErrorMessage = helpers.errors.getMessage(error);

  return new DevWorkspaceClientError(
    `${additionalMessage}: ${originErrorMessage}`,
    name,
    statusCode,
  );
}
