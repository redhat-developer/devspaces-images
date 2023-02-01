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

import { V220Devfile } from '@devfile/api';
import { DevfileMetadata, DevfileMetadataLike } from './metadata';

export type DevfileLike = V220Devfile & {
  metadata?: DevfileMetadataLike;
};

export type Devfile = DevfileLike &
  Required<Pick<DevfileLike, 'metadata'>> & {
    metadata: DevfileMetadata;
  };
