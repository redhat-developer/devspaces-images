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

import { AlertVariant, Button, Divider, Flex, FlexItem } from '@patternfly/react-core';
import { CompressIcon, CopyIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import stringify from '../../services/helpers/editor';
import styles from './index.module.css';
import devfileApi from '../../services/devfileApi';
import { AppAlerts } from '../../services/alerts/appAlerts';
import { lazyInject } from '../../inversify.config';
import { AlertItem } from '../../services/helpers/types';
import { helpers } from '@eclipse-che/common';
import { ToggleBarsContext } from '../../contexts/ToggleBars';

type Props = {
  content: devfileApi.DevWorkspace | devfileApi.Devfile;
  handleExpand: (isExpand: boolean) => void;
};

type State = {
  copied?: boolean;
  isExpanded: boolean;
  contentText: string;
  isWorkspace: boolean;
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
      isWorkspace: false,
      contentBlobUrl: '',
    };
  }

  public componentDidMount(): void {
    const { content } = this.props;
    try {
      const contentText = stringify(content);
      const isWorkspace = this.isWorkspace(content);
      const contentBlobUrl = URL.createObjectURL(
        new Blob([contentText], { type: 'application/x-yaml' }),
      );
      this.setState({ contentText, isWorkspace, contentBlobUrl });
    } catch (e) {
      this.showAlert({
        key: 'editor-tools-create blob-url-fails',
        variant: AlertVariant.danger,
        title: helpers.errors.getMessage(e),
      });
    }
  }

  public componentDidUpdate(): void {
    const { content } = this.props;
    try {
      const contentText = stringify(content);
      if (contentText !== this.state.contentText) {
        const isWorkspace = this.isWorkspace(content);
        const contentBlobUrl = URL.createObjectURL(
          new Blob([contentText], { type: 'application/x-yaml' }),
        );
        this.setState({ contentText, isWorkspace, contentBlobUrl });
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

  private getName(content: devfileApi.DevWorkspace | devfileApi.Devfile): string | undefined {
    if ((content as devfileApi.DevWorkspace)?.kind === 'DevWorkspace') {
      return (content as devfileApi.DevWorkspace).metadata.name;
    } else {
      return (content as devfileApi.Devfile).metadata.name;
    }
    return undefined;
  }

  private isWorkspace(content: devfileApi.DevWorkspace | devfileApi.Devfile): boolean {
    if ((content as devfileApi.DevWorkspace)?.kind === 'DevWorkspace') {
      return true;
    }
    return false;
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

  public render(): React.ReactElement {
    const { contentText, isWorkspace, contentBlobUrl, isExpanded, copied } = this.state;
    const name = this.getName(this.props.content);

    return (
      <div className={styles.editorTools}>
        <Flex>
          <FlexItem>
            <CopyToClipboard text={contentText} onCopy={() => this.onCopyToClipboard()}>
              <Button variant="link">
                <CopyIcon />
                {copied ? 'Copied' : 'Copy to clipboard'}
              </Button>
            </CopyToClipboard>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <a
              download={`${name}.${isWorkspace ? 'workspace' : 'devfile'}.yaml`}
              href={contentBlobUrl}
            >
              <DownloadIcon />
              Download
            </a>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <Button variant="link" onClick={() => this.handleExpand()}>
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

export default EditorTools;
