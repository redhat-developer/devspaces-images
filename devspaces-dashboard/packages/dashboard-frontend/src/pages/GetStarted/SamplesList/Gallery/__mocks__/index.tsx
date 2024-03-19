/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { Props } from '@/pages/GetStarted/SamplesList/Gallery';

export default class SamplesListGallery extends React.PureComponent<Props> {
  render() {
    const { onCardClick, metadataFiltered = [] } = this.props;
    return (
      <div data-testid="samples-list-gallery">
        <div>Samples List Gallery</div>
        {metadataFiltered.map(metadata => (
          <div key={metadata.links.v2} data-testid="sample-card">
            {metadata.displayName}

            <button
              onClick={() => {
                onCardClick(metadata);
              }}
            >
              Select Sample
            </button>
          </div>
        ))}
      </div>
    );
  }
}
