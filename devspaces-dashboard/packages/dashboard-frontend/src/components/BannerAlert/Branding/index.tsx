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

import { Banner } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import sanitizeHtml from 'sanitize-html';
import { AppState } from '../../../store';
import { selectBranding } from '../../../store/Branding/selectors';

type Props = MappedProps;

class BannerAlertBranding extends React.PureComponent<Props> {
  render() {
    const warningMessage = this.props.branding.header?.warning;
    if (!warningMessage) {
      return null;
    }

    const warningMessageHTML = sanitizeHtml(warningMessage, {
      allowedTags: ['a'],
      allowedAttributes: {
        a: ['href', 'target'],
      },
      allowedSchemes: ['http', 'https'],
    });

    return (
      <Banner className="pf-u-text-align-center" variant="warning">
        <div dangerouslySetInnerHTML={{ __html: warningMessageHTML }}></div>
      </Banner>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(BannerAlertBranding);
