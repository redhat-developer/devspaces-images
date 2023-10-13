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
  Button,
  Divider,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { CompressIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons';
import React from 'react';

import { ToggleBarsContext } from '@/contexts/ToggleBars';

export type Props = {
  onToggle: (isExpand: boolean) => void;
  onDownload: () => void;
};

export type State = {
  isExpanded: boolean;
};

export class WorkspaceLogsViewerTools extends React.PureComponent<Props, State> {
  static contextType = ToggleBarsContext;
  readonly context: React.ContextType<typeof ToggleBarsContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };
  }

  private handleToggle(): void {
    const isExpanded = !this.state.isExpanded;
    this.setState({ isExpanded });
    this.props.onToggle(isExpanded);

    if (this.state.isExpanded) {
      this.context.showAll();
    } else {
      this.context.hideAll();
    }
  }

  private handleDownload(): void {
    this.props.onDownload();
  }

  render(): React.ReactElement {
    return (
      <TextContent>
        <Text component={TextVariants.small}>
          <Flex>
            <FlexItem>
              <Button
                isInline
                variant="link"
                onClick={() => this.handleDownload()}
                icon={<DownloadIcon />}
              >
                Download
              </Button>
            </FlexItem>
            <Divider isVertical component="div" />
            <FlexItem>
              <Button
                isInline
                variant="link"
                onClick={() => this.handleToggle()}
                icon={this.state.isExpanded ? <CompressIcon /> : <ExpandIcon />}
              >
                {this.state.isExpanded ? 'Compress' : 'Expand'}
              </Button>
            </FlexItem>
          </Flex>
        </Text>
      </TextContent>
    );
  }
}
