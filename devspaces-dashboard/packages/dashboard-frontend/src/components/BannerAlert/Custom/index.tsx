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
import { selectBannerAlertMessages } from '../../../store/BannerAlert/selectors';

import styles from './index.module.css';

type Props = MappedProps;

class BannerAlertCustomWarning extends React.PureComponent<Props> {
  render() {
    const messages = this.props.bannerAlertMessages;
    if (messages.length === 0) {
      return null;
    }

    const sanitizedMessages = messages.map(message =>
      sanitizeHtml(message, {
        allowedTags: ['a'],
        allowedAttributes: {
          a: ['href', 'target'],
        },
        allowedSchemes: ['http', 'https'],
      }),
    );

    const banners = sanitizedMessages.map(message => (
      <Banner key={message} className={styles.customBanner} variant="warning">
        <div dangerouslySetInnerHTML={{ __html: message }}></div>
      </Banner>
    ));

    return <>{banners}</>;
  }
}

const mapStateToProps = (state: AppState) => ({
  bannerAlertMessages: selectBannerAlertMessages(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(BannerAlertCustomWarning);
