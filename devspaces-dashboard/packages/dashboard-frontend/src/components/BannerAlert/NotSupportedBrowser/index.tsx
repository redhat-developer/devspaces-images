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

import { Banner } from '@patternfly/react-core';
import React from 'react';
import { isSafari } from '../../../services/helpers/detectBrowser';

type Props = unknown;

type State = {
  isNotSupported: boolean;
};

export default class BannerAlertNotSupportedBrowser extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isNotSupported: isSafari,
    };
  }

  render() {
    if (this.state.isNotSupported === false) {
      return null;
    }

    return (
      <Banner className="pf-u-text-align-center" variant="warning">
        The browser you are using is not supported. We recommend using <b>Google Chrome</b> to have
        the best possible experience.
      </Banner>
    );
  }
}
