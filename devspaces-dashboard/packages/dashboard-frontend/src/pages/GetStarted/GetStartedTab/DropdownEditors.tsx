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
import { TargetEditor } from './SamplesListGallery';
import { CheckIcon } from '@patternfly/react-icons';
import { DropdownGroup, DropdownItem } from '@patternfly/react-core';
import TagLabel from '../../../components/TagLabel';

type Props = {
  targetEditors: TargetEditor[];
  onClick: (editorId: string) => void;
};

class DropdownEditors extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { targetEditors, onClick } = this.props;

    return (
      <DropdownGroup style={{ whiteSpace: 'nowrap' }} label="Choose an editor">
        {targetEditors.map(editor => {
          return (
            <DropdownItem
              key={editor.id}
              tooltip={editor.tooltip}
              onClick={() => onClick(editor.id)}
            >
              <span style={{ textTransform: 'capitalize' }}>{editor.name}</span>
              <TagLabel version={editor.version} />
              {editor.isDefault && (
                <CheckIcon
                  data-testid="checkmark"
                  style={{
                    float: 'right',
                    opacity: '0.6',
                    marginTop: '3px',
                  }}
                />
              )}
            </DropdownItem>
          );
        })}
      </DropdownGroup>
    );
  }
}

export default DropdownEditors;
