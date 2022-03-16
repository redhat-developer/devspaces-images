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

import React from 'react';
import {
  AboutModal as PatternflyAboutModal,
  TextContent,
  TextList,
  TextListItem,
} from '@patternfly/react-core';
import { detect } from 'detect-browser';

type Props = {
  productName: string | undefined;
  serverVersion: string | undefined;
  logo: string;
  isOpen: boolean;
  closeModal: () => void;
  username: string | undefined;
};

export class AboutModal extends React.PureComponent<Props> {
  private browserVersion: string | undefined | null;
  private browserOS: string | undefined | null;
  private browserName: string | undefined;

  constructor(props: Props) {
    super(props);

    const browser = detect();
    this.browserVersion = browser?.version;
    this.browserOS = browser?.os;
    this.browserName = browser?.name;
  }

  private buildContent(): React.ReactElement {
    const dashboardVersion = process.env.DASHBOARD_VERSION;
    const serverVersion = this.props.serverVersion;
    const username = this.props.username;
    const browserVersion = this.browserVersion;
    const browserOS = this.browserOS;
    const browserName = this.browserName;

    return (
      <TextContent>
        <TextList component="dl">
          {dashboardVersion && (
            <>
              <TextListItem component="dt">Dashboard Version</TextListItem>
              <TextListItem
                component="dd"
                className="co-select-to-copy"
                data-testid="dashboard-version"
              >
                {dashboardVersion}
              </TextListItem>
            </>
          )}
          {serverVersion && (
            <>
              <TextListItem component="dt">Server Version</TextListItem>
              <TextListItem
                component="dd"
                className="co-select-to-copy"
                data-testid="server-version"
              >
                {serverVersion}
              </TextListItem>
            </>
          )}
          {username && (
            <>
              <TextListItem component="dt">Username</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy" data-testid="username">
                {username}
              </TextListItem>
            </>
          )}
          {browserName && (
            <>
              <TextListItem component="dt">Browser Name</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy" data-testid="browser-name">
                {browserName}
              </TextListItem>
            </>
          )}
          {browserVersion && (
            <>
              <TextListItem component="dt">Browser Version</TextListItem>
              <TextListItem
                component="dd"
                className="co-select-to-copy"
                data-testid="browser-version"
              >
                {browserVersion}
              </TextListItem>
            </>
          )}
          {browserOS && (
            <>
              <TextListItem component="dt">Browser OS</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy" data-testid="browser-os">
                {browserOS}
              </TextListItem>
            </>
          )}
        </TextList>
      </TextContent>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, logo, productName } = this.props;

    const modalContent = this.buildContent();

    return (
      <PatternflyAboutModal
        isOpen={isOpen}
        onClose={() => this.props.closeModal()}
        brandImageSrc={logo}
        brandImageAlt={`${productName} logo`}
        noAboutModalBoxContentContainer={true}
      >
        {modalContent}
      </PatternflyAboutModal>
    );
  }
}
