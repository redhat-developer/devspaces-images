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

import { History } from 'history';
import React from 'react';
import { Brand, PageHeader } from '@patternfly/react-core';
import { User } from 'che';

import HeaderTools from './Tools';
import { ThemeVariant } from '../themeVariant';

type Props = {
  history: History;
  isVisible: boolean;
  logoUrl: string;
  user: User | undefined;
  logout: () => void;
  toggleNav: () => void;
  changeTheme: (theme: ThemeVariant) => void;
};
type State = {
  isVisible: boolean;
};

export default class Header extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isVisible: this.props.isVisible,
    };
  }

  private toggleNav(): void {
    this.props.toggleNav();
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.isVisible !== this.props.isVisible) {
      this.setState({
        isVisible: this.props.isVisible,
      });
    }
  }

  public render(): React.ReactElement {
    const logo = <Brand src={this.props.logoUrl} alt="Logo" />;
    const className = this.state.isVisible ? 'show-header' : 'hide-header';

    return (
      <PageHeader
        style={{ zIndex: 'inherit' }}
        className={className}
        logoComponent="div"
        logo={logo}
        showNavToggle={true}
        onNavToggle={() => this.toggleNav()}
        headerTools={
          <HeaderTools
            history={this.props.history}
            user={this.props.user}
            logout={() => this.props.logout()}
          />
        }
      />
    );
  }
}
