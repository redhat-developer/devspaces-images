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
import * as k8s from '@kubernetes/client-node';
import { findApi } from '../../../helpers/findApi';

const projectApiGroup = 'project.openshift.io';

export async function isOpenShift(apisApi: k8s.ApisApi): Promise<boolean> {
  try {
    return findApi(apisApi, projectApiGroup);
  } catch (e) {
    throw new Error(`Can't evaluate target platform: ${helpers.errors.getMessage(e)}`);
  }
}
