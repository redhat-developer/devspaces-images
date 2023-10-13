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

import {
  ApplicationLauncher,
  ApplicationLauncherGroup,
  ApplicationLauncherItem,
} from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import React from 'react';

import { AboutModal } from '@/Layout/Header/Tools/AboutMenu/Modal';
import { BrandingData } from '@/services/bootstrap/branding.constant';

type Props = {
  branding: BrandingData;
  username: string;
  dashboardLogo?: { base64data: string; mediatype: string };
};
type State = {
  isLauncherOpen: boolean;
  isModalOpen: boolean;
};

export class AboutMenu extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isLauncherOpen: false,
      isModalOpen: false,
    };
  }

  private buildLauncherItems(): React.ReactNode[] {
    const branding = this.props.branding;
    const items: React.ReactElement[] = [];
    branding.links?.forEach(link => {
      items.push(
        <ApplicationLauncherItem
          key={link.text}
          isExternal={true}
          component="button"
          onClick={() => window.open(link.href, '_blank')}
        >
          {link.text}
        </ApplicationLauncherItem>,
      );
    });

    const group = (
      <ApplicationLauncherGroup key="info_button">
        {items}
        <ApplicationLauncherItem key="about" component="button" onClick={e => this.showModal(e)}>
          About
        </ApplicationLauncherItem>
      </ApplicationLauncherGroup>
    );
    return [group];
  }

  private onLauncherToggle() {
    this.setState({
      isLauncherOpen: !this.state.isLauncherOpen,
    });
  }

  private showModal(e: MouseEvent | React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    this.setState({
      isLauncherOpen: false,
      isModalOpen: true,
    });
  }

  private closeModal() {
    this.setState({
      isLauncherOpen: false,
      isModalOpen: false,
    });
  }

  public render(): React.ReactElement {
    const { username, dashboardLogo } = this.props;
    const { isLauncherOpen, isModalOpen } = this.state;

    const { logoFile, name, productVersion } = this.props.branding;

    const logoSrc =
      dashboardLogo !== undefined
        ? `data:${dashboardLogo.mediatype};base64,${dashboardLogo.base64data}`
        : logoFile;

    return (
      <>
        <ApplicationLauncher
          onToggle={() => this.onLauncherToggle()}
          isOpen={isLauncherOpen}
          items={this.buildLauncherItems()}
          aria-label="About Menu"
          position="right"
          toggleIcon={<QuestionCircleIcon alt="About Menu Icon" />}
        />
        <AboutModal
          isOpen={isModalOpen}
          closeModal={() => this.closeModal()}
          username={username}
          logo={logoSrc}
          productName={name}
          serverVersion={productVersion}
        />
      </>
    );
  }
}
