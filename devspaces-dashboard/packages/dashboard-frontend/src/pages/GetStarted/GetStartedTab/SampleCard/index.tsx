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
  Badge,
  Brand,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardHeaderMain,
  Dropdown,
  DropdownPosition,
  KebabToggle,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import React from 'react';

import DropdownEditors from '@/pages/GetStarted/GetStartedTab/DropdownEditors';
import styles from '@/pages/GetStarted/GetStartedTab/SampleCard/index.module.css';
import { TargetEditor, VISIBLE_TAGS } from '@/pages/GetStarted/GetStartedTab/SamplesListGallery';
import { convertIconToSrc } from '@/services/registry/devfiles';

type Props = {
  metadata: che.DevfileMetaData;
  targetEditors: TargetEditor[];
  onClick: (editorId: string | undefined) => void;
};
type State = {
  isExpanded: boolean;
};

export class SampleCard extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };
  }

  private getTags(): JSX.Element[] {
    const {
      metadata: { tags },
    } = this.props;

    const createTag = (text: string, key: number): React.ReactElement => {
      return (
        <Badge
          isRead
          style={{ whiteSpace: 'nowrap' }}
          key={`badge_${key}`}
          data-testid="card-badge"
        >
          {text.trim()}
        </Badge>
      );
    };

    return tags
      .filter(tag => VISIBLE_TAGS.indexOf(tag) !== -1)
      .map((item: string, index: number) => createTag(item, index));
  }

  private getEditors(): TargetEditor[] {
    const editors: TargetEditor[] = [];
    this.props.targetEditors.forEach((editor: TargetEditor) => {
      const isAdded = editors.find(e => e.name === editor.name);
      if (!isAdded) {
        editors.push(editor);
        return;
      }
      if (isAdded.isDefault || isAdded.version === 'next') {
        return;
      }
      if (editor.isDefault || editor.version === 'next' || editor.version === 'latest') {
        const existingEditorIndex = editors.indexOf(isAdded);
        editors[existingEditorIndex] = editor;
      }
    });
    return editors;
  }

  private getDropdownItems(): React.ReactNode[] {
    const targetEditors = this.getEditors();

    return [
      <DropdownEditors
        key="che-editors"
        targetEditors={targetEditors}
        onClick={(editorId: string) => {
          this.setState({ isExpanded: false });
          this.props.onClick(editorId);
        }}
      />,
    ];
  }

  render(): React.ReactElement {
    const { metadata } = this.props;
    const { isExpanded } = this.state;
    const tags = this.getTags();
    const devfileIcon = this.buildIcon(metadata);
    const dropdownItems = this.getDropdownItems();
    const onClickHandler = () => this.props.onClick(undefined);

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
          <CardActions>
            {tags}
            <Dropdown
              style={{ whiteSpace: 'nowrap' }}
              onClick={e => e.stopPropagation()}
              toggle={
                <KebabToggle
                  onToggle={isExpanded => {
                    this.setState({ isExpanded });
                  }}
                />
              }
              isOpen={isExpanded}
              position={DropdownPosition.right}
              dropdownItems={dropdownItems}
              isPlain
            />
          </CardActions>
        </CardHeader>
        <CardHeader>{metadata.displayName}</CardHeader>
        <CardBody>{metadata.description}</CardBody>
      </Card>
    );
  }

  private buildIcon(metadata: che.DevfileMetaData): React.ReactElement {
    const props = {
      className: styles.sampleCardIcon,
      alt: metadata.displayName,
      'aria-label': metadata.displayName,
      'data-testid': 'sample-card-icon',
    };

    return metadata.icon ? (
      <Brand src={convertIconToSrc(metadata.icon)} {...props} />
    ) : (
      <CubesIcon {...props} />
    );
  }
}
