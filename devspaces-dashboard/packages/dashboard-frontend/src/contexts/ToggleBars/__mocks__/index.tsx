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

import React from 'react';

import { ToggleBarsType } from '..';

/* istanbul ignore next */
const defaultValue: ToggleBarsType = {
  hideAll: () => {
    console.info('Navigation and top bars are hidden');
  },
  showAll: () => {
    console.info('Navigation and top bars are shown');
  },
};

export const ToggleBarsContext = React.createContext(defaultValue);
export const ToggleBarsConsumer = ToggleBarsContext.Consumer;
