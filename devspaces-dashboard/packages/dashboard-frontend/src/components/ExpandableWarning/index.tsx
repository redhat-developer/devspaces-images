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
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ExpandableSectionToggle,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import styles from '@/components/ExpandableWarning/index.module.css';

export const ERROR_MESSAGE_ID = 'expandable-warning-error-message';

type Props = {
  textBefore: string;
  errorMessage: string;
  textAfter: string;
};
type State = {
  copied: boolean;
  hasExpand: boolean;
  isExpanded: boolean;
};

class ExpandableWarning extends React.Component<Props, State> {
  private readonly checkOverflow: () => void;
  private copiedTimer: number | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      copied: false,
      hasExpand: false,
      isExpanded: false,
    };

    this.checkOverflow = () => {
      if (this.state.isExpanded) {
        this.setState({
          isExpanded: false,
        });
        return;
      }
      const errorMessageElement = document.getElementById(ERROR_MESSAGE_ID);
      if (errorMessageElement !== null) {
        const { offsetWidth, scrollWidth } = errorMessageElement;
        const showExpandToggle = scrollWidth > offsetWidth;
        this.setState({
          hasExpand: showExpandToggle,
        });
      }
    };
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.checkOverflow, false);
    this.checkOverflow();
  }

  public componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
    if (
      prevProps.errorMessage !== this.props.errorMessage ||
      (prevState.isExpanded && !this.state.isExpanded)
    ) {
      this.checkOverflow();
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.checkOverflow);
  }

  private onToggle(isExpanded: boolean) {
    this.setState({ isExpanded });
  }

  private onCopyToClipboard() {
    this.setState({ copied: true });
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = window.setTimeout(() => {
      this.setState({ copied: false });
    }, 3000);
  }

  render(): React.ReactElement {
    const { errorMessage, textBefore, textAfter } = this.props;
    const { hasExpand, isExpanded, copied } = this.state;
    const copyIconTitle = copied ? 'Copied' : 'Copy to clipboard';
    const actions = (
      <CodeBlockAction>
        <CopyToClipboard text={errorMessage} onCopy={() => this.onCopyToClipboard()}>
          <Button variant="link" isSmall={true}>
            <CopyIcon />
            &nbsp;{copyIconTitle}
          </Button>
        </CopyToClipboard>
      </CodeBlockAction>
    );

    const expandableSectionTitle = isExpanded ? 'Show Less' : 'Show More';
    const messageClassName = isExpanded ? undefined : styles.hideOverflow;
    return (
      <>
        <TextContent>
          <Text component={TextVariants.small}>{textBefore}</Text>
          <Text component={TextVariants.small}>
            <CodeBlock actions={actions} className={styles.error}>
              <CodeBlockCode>
                <Text
                  id={ERROR_MESSAGE_ID}
                  data-testid={ERROR_MESSAGE_ID}
                  className={messageClassName}
                  component={TextVariants.small}
                >
                  {errorMessage}
                </Text>
              </CodeBlockCode>
              {hasExpand && (
                <ExpandableSectionToggle
                  isExpanded={isExpanded}
                  onToggle={isExpanded => this.onToggle(isExpanded)}
                  direction="up"
                >
                  {expandableSectionTitle}
                </ExpandableSectionToggle>
              )}
            </CodeBlock>
          </Text>
          <Text component={TextVariants.small}>{textAfter}</Text>
        </TextContent>
      </>
    );
  }
}

export default ExpandableWarning;
