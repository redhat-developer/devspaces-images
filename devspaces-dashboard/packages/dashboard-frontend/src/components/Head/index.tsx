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
import { Helmet } from 'react-helmet';
import { connect, ConnectedProps } from 'react-redux';

import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';

type Props = MappedProps & {
  pageName?: string;
};

class Head extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const {
      pageName,
      branding: { title },
    } = this.props;

    return (
      <Helmet>
        <title>{pageName ? `${title} | ${pageName}` : title}</title>
      </Helmet>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(Head);
