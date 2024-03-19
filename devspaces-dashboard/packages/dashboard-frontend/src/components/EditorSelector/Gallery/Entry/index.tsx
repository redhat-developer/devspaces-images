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

import {
  Card,
  CardActions,
  CardBody,
  CardHeader,
  Dropdown,
  DropdownItem,
  KebabToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import React from 'react';

import styles from '@/components/EditorSelector/Gallery/Entry/index.module.css';
import TagLabel from '@/components/TagLabel';
import { che } from '@/services/models';

export type Props = {
  editorsGroup: che.Plugin[];
  groupIcon: string;
  groupName: string;
  selectedId: string;
  onSelect: (editorId: string) => void;
};
export type State = {
  activeEditor: che.Plugin;
  isKebabOpen: boolean;
  isSelectedGroup: boolean;
};

export class EditorSelectorEntry extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    // define if this editor group is selected
    const selectedEditor = props.editorsGroup.find(editor => editor.id === props.selectedId);
    const isSelectedGroup = selectedEditor !== undefined;

    this.state = {
      activeEditor: selectedEditor || props.editorsGroup[0],
      isKebabOpen: false,
      isSelectedGroup,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.selectedId !== this.props.selectedId) {
      const selectedEditor = this.props.editorsGroup.find(
        editor => editor.id === this.props.selectedId,
      );

      if (selectedEditor === undefined) {
        this.setState({
          isSelectedGroup: false,
        });
        return;
      }

      this.setState({
        activeEditor: selectedEditor,
        isSelectedGroup: true,
      });
    }
  }

  private handleCardClick(event: React.MouseEvent) {
    event.preventDefault();

    const { selectedId, onSelect } = this.props;
    const { activeEditor } = this.state;

    if (activeEditor.id === selectedId) {
      return;
    }

    onSelect(activeEditor.id);
  }

  private handleDropdownToggle(
    isKebabOpen: boolean,
    event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
  ) {
    event.stopPropagation();

    this.setState({ isKebabOpen });
  }

  private handleDropdownSelect(
    event: MouseEvent | React.MouseEvent | React.KeyboardEvent,
    editor: che.Plugin,
  ) {
    event.stopPropagation();
    event.preventDefault();

    this.setState({
      activeEditor: editor,
      isKebabOpen: false,
    });

    const { selectedId, onSelect } = this.props;
    const { activeEditor } = this.state;
    if (selectedId === activeEditor.id && selectedId !== editor.id) {
      onSelect(editor.id);
    }
  }

  private buildDropdownItems(): React.ReactNode[] {
    const { editorsGroup } = this.props;
    const { activeEditor } = this.state;

    return editorsGroup.map(editor => {
      const isChecked = editor.version === activeEditor.version;
      return (
        <DropdownItem
          key={editor.id}
          onClick={event => this.handleDropdownSelect(event, editor)}
          data-testid="editor-card-action"
          aria-checked={isChecked}
          icon={isChecked ? <CheckIcon /> : <></>}
        >
          {editor.version}
        </DropdownItem>
      );
    });
  }

  public render(): React.ReactElement {
    const { groupIcon, groupName } = this.props;
    const { isKebabOpen, isSelectedGroup, activeEditor } = this.state;

    const dropdownItems = this.buildDropdownItems();
    const areaLabel = `Select ${groupName} ${activeEditor.version} `;

    const titleClassName = isSelectedGroup ? styles.activeCard : '';

    return (
      <Card
        hasSelectableInput={true}
        id={'editor-selector-card-' + activeEditor.id}
        isCompact={true}
        isFlat={true}
        isSelectableRaised
        isSelected={isSelectedGroup}
        onClick={event => this.handleCardClick(event)}
        selectableInputAriaLabel={areaLabel}
      >
        <CardHeader>
          <img src={groupIcon} className={styles.editorIcon} />
          <CardActions>
            <Dropdown
              toggle={
                <KebabToggle
                  onToggle={(isOpen, event) => this.handleDropdownToggle(isOpen, event)}
                />
              }
              isOpen={isKebabOpen}
              isPlain
              dropdownItems={dropdownItems}
            />
          </CardActions>
        </CardHeader>
        <CardBody>
          <span className={titleClassName}>{groupName}</span>
          <TagLabel version={activeEditor.version}></TagLabel>
        </CardBody>
      </Card>
    );
  }
}
