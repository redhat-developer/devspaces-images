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
import { Flex, FlexItem, Button, Divider } from '@patternfly/react-core';
import { CompressIcon, CopyIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons/dist/js/icons';
import CopyToClipboard from 'react-copy-to-clipboard';
import stringify from '../../../../services/helpers/editor';

import './EditorTools.styl';

type Props = {
  devfile: che.WorkspaceDevfile;
  handleExpand: (isExpand: boolean) => void;
};

type State = {
  copied?: boolean;
  isExpanded: boolean;
};

class EditorTools extends React.PureComponent<Props, State> {
  private readonly handleExpand: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };

    this.handleExpand = () => {
      if (this.state.isExpanded) {
        window.postMessage('show-navbar', '*');
        const isExpanded = false;
        this.setState({ isExpanded });
        this.props.handleExpand(isExpanded);
      } else {
        window.postMessage('hide-navbar', '*');
        const isExpanded = true;
        this.setState({ isExpanded });
        this.props.handleExpand(isExpanded);
      }
    };
  }

  public render(): React.ReactElement {
    const devfileText = stringify(this.props.devfile);
    const devfileBlobUrl = URL.createObjectURL(new Blob([devfileText], { type: 'application/x-yaml' }));

    let copiedTimer;
    const onCopyToClipboard = () => {
      this.setState({ copied: true });
      if (copiedTimer) {
        clearTimeout(copiedTimer);
      }
      copiedTimer = setTimeout(() => {
        this.setState({ copied: false });
      }, 3000);
    };

    return (
      <div className="editor-tools">
        <Flex>
          <FlexItem>
            <CopyToClipboard text={devfileText} onCopy={() => onCopyToClipboard()}>
              <Button variant="link">
                <CopyIcon />{this.state.copied ? 'Copied' : 'Copy to clipboard'}
              </Button>
            </CopyToClipboard>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <a download="devfile.yaml" href={devfileBlobUrl}><DownloadIcon />Download</a>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <Button variant="link" onClick={() => this.handleExpand()}>
              {this.state.isExpanded ? (
                <React.Fragment><CompressIcon />Compress</React.Fragment>
              ) : (
                  <React.Fragment><ExpandIcon />Expand</React.Fragment>
                )}
            </Button>
          </FlexItem>
        </Flex>
      </div>
    );
  }
}

export default EditorTools;
