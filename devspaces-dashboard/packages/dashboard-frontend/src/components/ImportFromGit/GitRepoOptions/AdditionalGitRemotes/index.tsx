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
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormFieldGroup,
  FormSection,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { isEqual } from 'lodash';
import React from 'react';

import AdditionalGitRemote from '@/components/ImportFromGit/GitRepoOptions/AdditionalGitRemotes/gitRemote';
import styles from '@/components/ImportFromGit/GitRepoOptions/AdditionalGitRemotes/index.module.css';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';

export type Props = {
  onChange: (remotes: GitRemote[] | undefined, isValid: boolean) => void;
  remotes: GitRemote[] | undefined;
};
export type State = {
  remotes: GitRemote[];
};

export class AdditionalGitRemotes extends React.PureComponent<Props, State> {
  private readonly callbacks: { getValidation?: () => boolean }[];

  constructor(props: Props) {
    super(props);

    const remotes = this.props.remotes ? [...this.props.remotes] : [];
    if (remotes.length === 0) {
      remotes.push({ name: '', url: '' });
    }
    this.state = {
      remotes,
    };
    this.callbacks = remotes.map(() => ({}));
  }

  public componentDidMount(): void {
    const remotes = this.props.remotes || [];
    if (remotes.length > 0) {
      this.props.onChange(this.state.remotes, this.getValidate());
    }
  }

  public componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
    const remotes = this.props.remotes || [];
    const prevRemotes = prevProps.remotes || [];

    if (!isEqual(remotes, prevRemotes) && !isEqual(remotes, this.state.remotes)) {
      this.setState({
        remotes,
      });
    } else if (!isEqual(prevState.remotes, this.state.remotes)) {
      const validate = this.getValidate();
      this.props.onChange(this.state.remotes, validate);
    }
  }

  private getValidate(): boolean {
    const invalidIndex = this.callbacks.findIndex(
      callback => callback.getValidation && !callback.getValidation(),
    );
    return invalidIndex === -1;
  }

  private handleChange(index: number, remote: GitRemote): void {
    const remotes = [...this.state.remotes];
    remotes[index] = remote;

    this.setState({ remotes });
  }

  private handleAdd(): void {
    const remotes = [...this.state.remotes];
    remotes.push({ name: '', url: '' });

    this.setState({ remotes });
  }

  private handleRemove(index: number): void {
    const remotes = [...this.state.remotes];
    remotes.splice(index, 1);
    this.callbacks.splice(index, 1);

    this.setState({ remotes });
  }

  public buildGitRemotes(): React.JSX.Element {
    const { remotes } = this.state;
    this.callbacks.length = remotes.length;

    return (
      <>
        {remotes.map((remote: GitRemote, index: number) => {
          if (this.callbacks[index] === undefined) {
            this.callbacks[index] = {};
          }
          return (
            <AdditionalGitRemote
              key={'remote_' + index}
              remote={remote}
              onChange={(remote: GitRemote) => this.handleChange(index, remote)}
              callbacks={this.callbacks[index]}
              onDelete={() => this.handleRemove(index)}
            />
          );
        })}
      </>
    );
  }

  public render() {
    return (
      <Form isHorizontal={true}>
        <FormSection title="Additional Git Remotes" className={styles.gitRemotesTitle}>
          <FormFieldGroup className={styles.gitRemotesGroup}>
            {this.buildGitRemotes()}
            <ActionGroup style={{ marginTop: 0 }}>
              <Button
                onClick={() => this.handleAdd()}
                variant={ButtonVariant.link}
                style={{ textDecoration: 'none' }}
                isInline
                icon={<PlusCircleIcon />}
              >
                Add Remote
              </Button>
            </ActionGroup>
          </FormFieldGroup>
        </FormSection>
      </Form>
    );
  }
}
