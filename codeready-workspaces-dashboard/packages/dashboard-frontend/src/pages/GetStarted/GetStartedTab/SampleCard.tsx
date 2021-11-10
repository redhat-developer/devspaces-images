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
import { Brand, Card, CardBody, CardHeader, CardHeaderMain } from '@patternfly/react-core';
import './SampleCard.styl';

type SampleCardProps = {
  metadata: che.DevfileMetaData;
  onClick: (metadata: che.DevfileMetaData) => void;
};

export class SampleCard extends React.PureComponent<SampleCardProps> {
  render(): React.ReactElement {
    const metadata = this.props.metadata;
    const devfileIcon = this.buildIcon(metadata);
    const onClickHandler = (): void => this.props.onClick(metadata);

    return (
      <Card
        isFlat
        isHoverable
        isCompact
        isSelectable
        key={metadata.links.self}
        onClick={onClickHandler}
        className={'sample-card'}
      >
        <CardHeader>
          <CardHeaderMain>{devfileIcon}</CardHeaderMain>
        </CardHeader>
        <CardHeader>{metadata.displayName}</CardHeader>
        <CardBody>{metadata.description}</CardBody>
      </Card>
    );
  }

  private buildIcon(metadata: che.DevfileMetaData): React.ReactElement {
    return metadata.icon ? (
      <Brand src={metadata.icon} alt={metadata.displayName} style={{ height: '64px' }} />
    ) : (
      <div className="blank-icon">
        <div className="codicon codicon-symbol-method"></div>
      </div>
    );
  }
}
