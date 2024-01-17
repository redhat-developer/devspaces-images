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
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
  EmptyStateVariant,
  Gallery,
  Title,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { SampleCard } from '@/pages/GetStarted/GetStartedTab/SampleCard';
import { AlertItem } from '@/services/helpers/types';
import { che } from '@/services/models';
import { AppState } from '@/store';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import { EMPTY_WORKSPACE_TAG, selectMetadataFiltered } from '@/store/DevfileRegistries/selectors';
import * as FactoryResolverStore from '@/store/FactoryResolver';
import { selectEditors } from '@/store/Plugins/chePlugins/selectors';
import { selectDefaultEditor } from '@/store/Plugins/devWorkspacePlugins/selectors';

export type TargetEditor = {
  id: string;
  name: string;
  tooltip: string | undefined;
  version: string;
  isDefault: boolean;
};
type Props = MappedProps & {
  onCardClick: (
    devfileContent: string,
    stackName: string,
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ) => void;
  storageType: che.WorkspaceStorageType;
};
type State = {
  alerts: AlertItem[];
};

export const VISIBLE_TAGS = ['Community', 'Tech-Preview', 'Devfile.io'];

const EXCLUDED_TARGET_EDITOR_NAMES = ['dirigible', 'jupyter', 'eclipseide', 'code-server'];

export class SamplesListGallery extends React.PureComponent<Props, State> {
  private static sortByName(a: TargetEditor, b: TargetEditor): number {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
  private static sortByVisibleTag(a: che.DevfileMetaData, b: che.DevfileMetaData): number {
    const getVisibleTag = (metadata: che.DevfileMetaData) =>
      metadata.tags.filter(tag => VISIBLE_TAGS.includes(tag))[0];
    const tagA = getVisibleTag(a);
    const tagB = getVisibleTag(b);
    if (tagA === tagB) {
      return 0;
    }
    if (tagA === undefined || tagA < tagB) {
      return -1;
    }
    if (tagB === undefined || tagA > tagB) {
      return 1;
    }
    return 0;
  }
  private static sortByEmptyWorkspaceTag(a: che.DevfileMetaData, b: che.DevfileMetaData): number {
    if (a.tags.includes(EMPTY_WORKSPACE_TAG) > b.tags.includes(EMPTY_WORKSPACE_TAG)) {
      return -1;
    }
    if (a.tags.includes(EMPTY_WORKSPACE_TAG) < b.tags.includes(EMPTY_WORKSPACE_TAG)) {
      return 1;
    }
    return 0;
  }
  private static sortByDisplayName(a: che.DevfileMetaData, b: che.DevfileMetaData): number {
    if (a.displayName < b.displayName) {
      return -1;
    }
    if (a.displayName > b.displayName) {
      return 1;
    }
    return 0;
  }

  private isLoading: boolean;

  constructor(props: Props) {
    super(props);

    this.state = {
      alerts: [],
    };
    this.isLoading = false;
  }

  private removeAlert(key: string): void {
    this.setState({ alerts: [...this.state.alerts.filter(al => al.key !== key)] });
  }

  render(): React.ReactElement {
    const metadata = this.props.metadataFiltered;
    const cards = this.buildCardsList(metadata);

    if (cards.length) {
      return (
        <React.Fragment>
          <AlertGroup isToast>
            {this.state.alerts.map(({ title, variant, key }) => (
              <Alert
                variant={variant}
                title={title}
                key={key}
                actionClose={<AlertActionCloseButton onClose={() => this.removeAlert(key)} />}
              />
            ))}
          </AlertGroup>
          <Gallery hasGutter={true}>{cards}</Gallery>
        </React.Fragment>
      );
    }

    return this.buildEmptyState();
  }

  private async fetchDevfile(meta: che.DevfileMetaData, editor: string | undefined): Promise<void> {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      if (meta.links.v2) {
        const link = encodeURIComponent(meta.links.v2);
        let devWorkspace = '';
        if (!editor && this.props.defaultEditor) {
          editor = this.props.defaultEditor;
        }
        if (editor) {
          const prebuiltDevWorkspace = meta.links.devWorkspaces?.[editor];
          const storageType = this.props.storageType;
          devWorkspace = prebuiltDevWorkspace
            ? `&devWorkspace=${encodeURIComponent(prebuiltDevWorkspace)}&storageType=${storageType}`
            : `&storageType=${storageType}`;
        }
        // use factory workflow to load the getting started samples
        let factoryUrl = `${window.location.origin}${window.location.pathname}#/load-factory?url=${link}${devWorkspace}`;
        if (editor !== this.props.defaultEditor) {
          factoryUrl += `&che-editor=${editor}`;
        }
        // open a new page to handle that
        window.open(factoryUrl, '_blank');
      } else if (meta.links.self) {
        const devfileContent = (await this.props.requestDevfile(meta.links.self)) as string;
        this.props.onCardClick(devfileContent, meta.displayName);
      }
    } catch (e) {
      console.warn('Failed to load devfile.', e);
      const key = meta.links.self ? meta.links.self : meta.links.v2 || meta.displayName;
      const alerts = [
        ...this.state.alerts,
        {
          key,
          title: `Failed to load devfile "${meta.displayName}"`,
          variant: AlertVariant.warning,
        },
      ];
      this.setState({ alerts });
    }
    this.isLoading = false;
  }

  private buildCardsList(metadata: che.DevfileMetaData[] = []): React.ReactElement[] {
    const { editors, defaultEditor } = this.props;
    const targetEditors = editors
      .filter(editor => !EXCLUDED_TARGET_EDITOR_NAMES.includes(editor.name))
      .map(editor => {
        return {
          id: editor.id,
          version: editor.version,
          name: editor.displayName,
          tooltip: editor.description,
          isDefault: defaultEditor === editor.id,
        } as TargetEditor;
      });
    targetEditors.sort(SamplesListGallery.sortByName);

    return metadata
      .sort(SamplesListGallery.sortByDisplayName)
      .sort(SamplesListGallery.sortByVisibleTag)
      .sort(SamplesListGallery.sortByEmptyWorkspaceTag)
      .map(meta => (
        <SampleCard
          key={meta.links.self || meta.links.v2 || meta.displayName}
          metadata={meta}
          targetEditors={targetEditors}
          onClick={(editorId: string | undefined): Promise<void> =>
            this.fetchDevfile(meta, editorId)
          }
        />
      ));
  }

  private buildEmptyState(): React.ReactElement {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel="h1">No results found</Title>
        <EmptyStateBody>
          No results match the filter criteria. Clear filter to show results.
        </EmptyStateBody>
        <EmptyStatePrimary>
          <Button variant="link" onClick={(): void => this.props.clearFilter()}>
            Clear filter
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  metadataFiltered: selectMetadataFiltered(state),
  factoryResolver: state.factoryResolver,
  editors: selectEditors(state),
  defaultEditor: selectDefaultEditor(state),
});

const connector = connect(mapStateToProps, {
  ...DevfileRegistriesStore.actionCreators,
  ...FactoryResolverStore.actionCreators,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(SamplesListGallery);
