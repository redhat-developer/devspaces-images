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
import { Link } from 'react-router-dom';
import { NavItem } from '@patternfly/react-core';

import { NavigationItemObject } from '.';
import isActive from './isActive';

import styles from './index.module.css';

function NavigationMainItem(props: {
  item: NavigationItemObject;
  activePath?: string;
}): React.ReactElement {
  return (
    <NavItem itemId={props.item.to} isActive={isActive(props.item.to, props.activePath)}>
      <Link to={props.item.to} className={styles.mainItem}>
        {props.item.label}
      </Link>
    </NavItem>
  );
}
NavigationMainItem.displayName = 'NavigationMainItemComponent';
export default NavigationMainItem;
