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

import { Location } from 'history';

import {
  DEBUG_WORKSPACE_START,
  USE_DEFAULT_DEVFILE,
} from '@/services/helpers/factoryFlow/buildFactoryParams';

export function applyRestartDefaultLocation(location: Location): void {
  const searchParams = new URLSearchParams(location.search);
  searchParams.delete(DEBUG_WORKSPACE_START);
  searchParams.delete(USE_DEFAULT_DEVFILE);
  location.search = searchParams.toString();
}

export function applyRestartInDebugModeLocation(location: Location): void {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set(DEBUG_WORKSPACE_START, 'true');
  searchParams.delete(USE_DEFAULT_DEVFILE);
  location.search = searchParams.toString();
}

export function applyRestartInSafeModeLocation(location: Location): void {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set(USE_DEFAULT_DEVFILE, 'true');
  searchParams.delete(DEBUG_WORKSPACE_START);
  location.search = searchParams.toString();
}

export function resetRestartInSafeModeLocation(location: Location): boolean {
  const safeMode = getRestartInSafeModeLocation(location);
  if (safeMode) {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete(USE_DEFAULT_DEVFILE);
    location.search = searchParams.toString();
  }
  return safeMode;
}

export function getRestartInSafeModeLocation(location: Location): boolean {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get(USE_DEFAULT_DEVFILE) === 'true';
}

export function getRestartInDebugModeLocation(location: Location): boolean {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get(DEBUG_WORKSPACE_START) === 'true';
}

export function getStartParams(location: Location): { 'debug-workspace-start': true } | undefined {
  return getRestartInDebugModeLocation(location)
    ? {
        'debug-workspace-start': true,
      }
    : undefined;
}
