/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { PageSidebar } from '@patternfly/react-core';
import { History } from 'history';

import Navigation from './Navigation';
import { ThemeVariant } from './themeVariant';

type Props = {
  isManaged: boolean;
  isNavOpen: boolean;
  history: History;
  theme: ThemeVariant;
};

export default class Sidebar extends React.PureComponent<Props> {

  public render(): React.ReactElement {
    const { isNavOpen, history, theme } = this.props;

    return (
      <PageSidebar
        isNavOpen={isNavOpen}
        theme={theme}
        nav={
          <Navigation history={history} theme={theme} />
        }
      />
    );
  }

}
