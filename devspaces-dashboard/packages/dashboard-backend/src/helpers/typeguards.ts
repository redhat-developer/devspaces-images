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

import { HttpError, V1Status } from '@kubernetes/client-node';
import { Response } from 'request';

/**
 * Typeguard for request.Response
 */
export function isResponse(response: unknown): response is Response {
  return (
    (response as Response).statusCode !== undefined &&
    (response as Response).statusMessage !== undefined &&
    (response as Response).body !== undefined
  );
}

/**
 * Typeguard for k8s.V1Status
 */
export function isV1Status(status: unknown): status is V1Status {
  return (status as V1Status).kind === 'Status';
}

/**
 * Typeguard for HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    (error as HttpError).name === 'HttpError' &&
    (error as HttpError).message !== undefined &&
    isResponse((error as HttpError).response) &&
    isV1Status((error as HttpError).body)
  );
}
