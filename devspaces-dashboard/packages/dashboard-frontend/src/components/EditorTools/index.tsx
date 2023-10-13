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

import { ApplicationId, helpers } from '@eclipse-che/common';
import { AlertVariant, Button, Divider, Flex, FlexItem } from '@patternfly/react-core';
import {
  CompressIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  ExternalLinkSquareAltIcon,
} from '@patternfly/react-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { connect, ConnectedProps } from 'react-redux';

import styles from '@/components/EditorTools/index.module.css';
import { ToggleBarsContext } from '@/contexts/ToggleBars';
import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import devfileApi, { isDevfileV2, isDevWorkspace } from '@/services/devfileApi';
import stringify from '@/services/helpers/editor';
import { AlertItem } from '@/services/helpers/types';
import { WorkspaceAdapter } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { actionCreators } from '@/store/BannerAlert';
import { selectApplications } from '@/store/ClusterInfo/selectors';

type Props = MappedProps & {
  devfileOrDevWorkspace: devfileApi.DevWorkspace | devfileApi.Devfile;
  handleExpand: (isExpand: boolean) => void;
};

type State = {
  copied?: boolean;
  isExpanded: boolean;
  contentText: string;
  contentBlobUrl: string;
};

class EditorTools extends React.PureComponent<Props, State> {
  static contextType = ToggleBarsContext;
  readonly context: React.ContextType<typeof ToggleBarsContext>;

  private copiedTimer: number | undefined;

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      contentText: '',
      contentBlobUrl: '',
    };
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(): void {
    this.init();
  }

  private init() {
    const { devfileOrDevWorkspace } = this.props;
    try {
      const contentText = stringify(devfileOrDevWorkspace);
      if (contentText !== this.state.contentText) {
        const contentBlobUrl = URL.createObjectURL(
          new Blob([contentText], { type: 'application/x-yaml' }),
        );
        this.setState({ contentText, contentBlobUrl });
      }
    } catch (e) {
      this.showAlert({
        key: 'editor-tools-create blob-url-fails',
        variant: AlertVariant.danger,
        title: helpers.errors.getMessage(e),
      });
    }
  }

  private showAlert(alert: AlertItem): void {
    this.appAlerts.showAlert(alert);
  }

  private handleExpand(): void {
    if (this.state.isExpanded) {
      this.context.showAll();
      const isExpanded = false;
      this.setState({ isExpanded });
      this.props.handleExpand(isExpanded);
    } else {
      this.context.hideAll();
      const isExpanded = true;
      this.setState({ isExpanded });
      this.props.handleExpand(isExpanded);
    }
  }

  private onCopyToClipboard(): void {
    this.setState({ copied: true });
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = window.setTimeout(() => {
      this.setState({ copied: false });
    }, 3000);
  }

  private buildOpenShiftConsoleItem(): React.ReactElement | undefined {
    const { applications, devfileOrDevWorkspace } = this.props;
    const clusterConsole = applications.find(app => app.id === ApplicationId.CLUSTER_CONSOLE);

    if (isDevfileV2(devfileOrDevWorkspace)) {
      return;
    }
    const devWorkspace = devfileOrDevWorkspace;

    if (!clusterConsole) {
      return;
    }

    const devWorkspaceOpenShiftConsoleUrl = WorkspaceAdapter.buildClusterConsoleUrl(
      devWorkspace,
      clusterConsole.url,
    );

    return (
      <>
        <FlexItem>
          <Button
            className={styles.button}
            component="a"
            variant="link"
            href={devWorkspaceOpenShiftConsoleUrl}
            target="_blank"
            icon={<ExternalLinkSquareAltIcon />}
          >
            {clusterConsole.title}
          </Button>
        </FlexItem>
        <Divider isVertical />
      </>
    );
  }

  public render(): React.ReactElement {
    const { devfileOrDevWorkspace } = this.props;
    const { contentText, contentBlobUrl, isExpanded, copied } = this.state;

    const { name } = devfileOrDevWorkspace.metadata;

    const openshiftConsoleItem = this.buildOpenShiftConsoleItem();

    return (
      <div className={styles.editorTools}>
        <Flex>
          {openshiftConsoleItem}
          <FlexItem>
            <CopyToClipboard text={contentText} onCopy={() => this.onCopyToClipboard()}>
              <Button variant="link" className={styles.button}>
                <CopyIcon />
                {copied ? 'Copied' : 'Copy to clipboard'}
              </Button>
            </CopyToClipboard>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <a
              className={styles.button}
              download={`${name}.${
                isDevWorkspace(devfileOrDevWorkspace) ? 'workspace' : 'devfile'
              }.yaml`}
              href={contentBlobUrl}
            >
              <DownloadIcon />
              Download
            </a>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <Button className={styles.button} variant="link" onClick={() => this.handleExpand()}>
              {isExpanded ? (
                <React.Fragment>
                  <CompressIcon />
                  Compress
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <ExpandIcon />
                  Expand
                </React.Fragment>
              )}
            </Button>
          </FlexItem>
        </Flex>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  applications: selectApplications(state),
});

const connector = connect(mapStateToProps, actionCreators);

type MappedProps = ConnectedProps<typeof connector>;

export default connector(EditorTools);
