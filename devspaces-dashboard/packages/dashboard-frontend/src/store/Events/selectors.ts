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

import { createSelector } from 'reselect';
import { AppState } from '..';

const selectState = (state: AppState) => state.events;

export const selectAllEvents = createSelector(selectState, state => state.events);

export const selectEventsFromResourceVersion = createSelector(selectAllEvents, allEvents => {
  return (fromResourceVersionStr: string) => {
    return allEvents.filter(event => {
      if (event.metadata.resourceVersion === undefined) {
        return false;
      }
      const resourceVersion = parseInt(event.metadata.resourceVersion, 10);
      const fromResourceVersion = parseInt(fromResourceVersionStr, 10);
      if (isNaN(resourceVersion) || isNaN(fromResourceVersion)) {
        return false;
      }
      return fromResourceVersion <= resourceVersion;
    });
  };
});

export const selectEventsError = createSelector(selectState, state => state.error);

export const selectEventsResourceVersion = createSelector(
  selectState,
  state => state.resourceVersion,
);
