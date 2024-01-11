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

import { FileUploadIcon } from '@patternfly/react-icons';
import React from 'react';
import Pluralize from 'react-pluralize';

export type Props = {
  file: File | undefined;
};

export class TextFileUploadPreview extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { file } = this.props;

    if (file === undefined) {
      return <></>;
    }

    return (
      <div
        style={{ marginTop: 'var(--pf-global--spacer--sm)' }}
        data-testid="text-file-upload-preview"
      >
        <FileUploadIcon size="md" />
        Uploaded <Pluralize singular="byte" count={file.size} />
      </div>
    );
  }
}
