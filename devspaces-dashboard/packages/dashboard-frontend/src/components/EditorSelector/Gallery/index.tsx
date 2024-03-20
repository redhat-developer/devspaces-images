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

import { Gallery } from '@patternfly/react-core';
import React from 'react';

import { EditorSelectorEntry } from '@/components/EditorSelector/Gallery/Entry';
import { che } from '@/services/models';

export type Props = {
  defaultEditorId: string;
  editors: che.Plugin[];
  selectedEditorId: string | undefined;
  onSelect: (editorId: string) => void;
};
export type State = {
  selectedId: string;
  sortedEditorsByName: Map<string, che.Plugin[]>;
};

export class EditorGallery extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectedId: '', // will be set on component mount
      sortedEditorsByName: new Map<string, che.Plugin[]>(),
    };
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.selectedEditorId !== this.props.selectedEditorId) {
      this.init();
    }
  }

  private init(): void {
    const { defaultEditorId, editors, selectedEditorId, onSelect } = this.props;

    const sortedEditors = sortEditors(editors);

    const sortedEditorsByName = new Map<string, che.Plugin[]>();

    let defaultEditor: che.Plugin | undefined;
    let selectedEditor: che.Plugin | undefined;
    sortedEditors.forEach(editor => {
      const name = editor.name;
      if (!sortedEditorsByName.has(name)) {
        sortedEditorsByName.set(name, []);
      }
      sortedEditorsByName.get(name)?.push(editor);

      // find the default editor
      if (editor.id === defaultEditorId) {
        defaultEditor = editor;
      }
      // find the selected editor
      if (editor.id === selectedEditorId) {
        selectedEditor = editor;
      }
    });

    let selectedId: string;
    if (selectedEditor !== undefined) {
      selectedId = selectedEditor.id;
    } else {
      if (defaultEditor !== undefined) {
        selectedId = defaultEditor.id;
      } else {
        selectedId = sortedEditors[0].id;
      }
      onSelect(selectedId);
    }

    this.setState({
      selectedId,
      sortedEditorsByName,
    });
  }

  private handleEditorSelect(editorId: string): void {
    this.props.onSelect(editorId);
  }

  private buildEditorCards(): React.ReactNode[] {
    const { selectedId, sortedEditorsByName } = this.state;

    return Array.from(sortedEditorsByName.keys()).map(editorName => {
      // editors same name, different version
      const editorsGroup = sortedEditorsByName.get(editorName);

      /* c8 ignore next 3 */
      if (editorsGroup === undefined) {
        return;
      }

      const groupIcon = editorsGroup[0].icon;
      const groupName = editorsGroup[0].displayName || editorsGroup[0].name;

      return (
        <EditorSelectorEntry
          key={editorName}
          editorsGroup={editorsGroup}
          groupIcon={groupIcon}
          groupName={groupName}
          selectedId={selectedId}
          onSelect={editorId => this.handleEditorSelect(editorId)}
        />
      );
    });
  }

  public render() {
    return (
      <Gallery hasGutter={true} minWidths={{ default: '170px' }} maxWidths={{ default: '170px' }}>
        {this.buildEditorCards()}
      </Gallery>
    );
  }
}

const VERSION_PRIORITY: ReadonlyArray<string> = ['insiders', 'next', 'latest'];
export function sortEditors(editors: che.Plugin[]) {
  const sorted = editors.sort((a, b) => {
    if (a.name === b.name) {
      const aPriority = VERSION_PRIORITY.indexOf(a.version);
      const bPriority = VERSION_PRIORITY.indexOf(b.version);

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      } else if (aPriority !== -1) {
        return -1;
      } else if (bPriority !== -1) {
        return 1;
      }
    }

    return a.id.localeCompare(b.id);
  });

  return sorted;
}
