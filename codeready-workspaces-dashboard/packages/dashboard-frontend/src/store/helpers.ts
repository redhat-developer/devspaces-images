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

/**
 * Creates a new state object.
 * @param state a store state, e.g workspaces, plugins.
 * @param partial a slice of a store state
 */
export function createState<T>(state: T, partial: Partial<T>): T {
  return Object.assign({}, state, partial);
}
