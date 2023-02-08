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

import { V1Pod } from '@kubernetes/client-node';

/**
 * Compare two pods by uid or by name and namespace
 */
export default function isSamePod(pod1: V1Pod, pod2: V1Pod): boolean {
  // if uid is defined, compare by uid
  if (pod1.metadata?.uid !== undefined && pod2.metadata?.uid !== undefined) {
    return pod1.metadata.uid === pod2.metadata.uid;
  }
  // otherwise compare by name and namespace
  return (
    pod1.metadata?.name === pod2.metadata?.name &&
    pod1.metadata?.namespace === pod2.metadata?.namespace
  );
}
