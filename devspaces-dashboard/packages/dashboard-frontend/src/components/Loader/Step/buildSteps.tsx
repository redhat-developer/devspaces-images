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

import { List, LoaderStep, IdeLoaderSteps } from './index';

export function buildIdeLoaderSteps(): List<LoaderStep> {
  const stepsList = new List<LoaderStep>();
  stepsList.add(new LoaderStep(IdeLoaderSteps.INITIALIZING));
  stepsList.add(new LoaderStep(IdeLoaderSteps.START_WORKSPACE));
  stepsList.add(new LoaderStep(IdeLoaderSteps.OPEN_IDE));
  return stepsList;
}
