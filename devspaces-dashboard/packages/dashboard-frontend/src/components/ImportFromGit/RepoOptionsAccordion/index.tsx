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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Panel,
  PanelMain,
  PanelMainBody,
  ValidatedOptions,
} from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import {
  getAdvancedOptionsFromLocation,
  getGitRepoOptionsFromLocation,
  setAdvancedOptionsToLocation,
  setGitRepoOptionsToLocation,
  validateLocation,
} from '@/components/ImportFromGit/helpers';
import { AdvancedOptions } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions';
import { GitRepoOptions } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import { AppState } from '@/store';
import { selectSshKeys } from '@/store/SshKeys/selectors';

type AccordionId = 'git-repo-options' | 'advanced-options';

export type Props = MappedProps & {
  location: string;
  onChange: (location: string, remotesValidated: ValidatedOptions) => void;
};
export type State = {
  location: string;
  hasSshKeys: boolean;
  expanded: AccordionId[];
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  remotesValidated: ValidatedOptions;
  devfilePath: string | undefined;
  containerImage: string | undefined;
  temporaryStorage: boolean | undefined;
  createNewIfExisting: boolean | undefined;
  memoryLimit: number | undefined;
  cpuLimit: number | undefined;
  hasSupportedGitService: boolean;
};

class RepoOptionsAccordion extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { location } = props;

    this.state = {
      hasSupportedGitService: false,
      location,
      hasSshKeys: props.sshKeys.length > 0,
      expanded: [],
      gitBranch: undefined,
      remotes: undefined,
      remotesValidated: ValidatedOptions.default,
      devfilePath: undefined,
      containerImage: undefined,
      temporaryStorage: undefined,
      createNewIfExisting: undefined,
      memoryLimit: undefined,
      cpuLimit: undefined,
    };
  }

  private updateStateFromLocation(): void {
    const { location } = this.props;

    const validated = validateLocation(location, this.state.hasSshKeys);
    if (validated !== ValidatedOptions.success) {
      return;
    }
    const gitRepoOptions = getGitRepoOptionsFromLocation(location);
    if (!gitRepoOptions.location) {
      return;
    }
    const advancedOptions = getAdvancedOptionsFromLocation(gitRepoOptions.location);

    const state = Object.assign(gitRepoOptions, advancedOptions) as State;

    this.setState(state);
  }

  public componentDidMount() {
    this.updateStateFromLocation();
  }

  public componentDidUpdate(prevProps: Readonly<Props>) {
    const location = this.props.location.trim();
    if (location === prevProps.location || location === this.state.location) {
      return;
    }
    this.updateStateFromLocation();
  }

  private handleToggle(id: AccordionId): void {
    const { expanded } = this.state;
    const index = expanded.indexOf(id);
    const newExpanded: AccordionId[] =
      index >= 0
        ? [...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length)]
        : [...expanded, id];

    this.setState({
      expanded: newExpanded,
    });
  }

  private handleGitRepoOptionsChange(
    gitBranch: string | undefined,
    remotes: GitRemote[] | undefined,
    devfilePath: string | undefined,
    isValid: boolean,
  ): void {
    const state = setGitRepoOptionsToLocation(
      { gitBranch, remotes, devfilePath },
      {
        location: this.state.location,
        gitBranch: this.state.gitBranch,
        remotes: this.state.remotes,
        devfilePath: this.state.devfilePath,
      },
    ) as State;
    state.remotesValidated = isValid ? ValidatedOptions.success : ValidatedOptions.error;
    this.setState(state);
    this.props.onChange(state.location, state.remotesValidated);
  }

  private handleAdvancedOptionsOptionsChange(
    containerImage: string | undefined,
    temporaryStorage: boolean | undefined,
    createNewIfExisting: boolean | undefined,
    memoryLimit: number | undefined,
    cpuLimit: number | undefined,
  ) {
    const state = setAdvancedOptionsToLocation(
      {
        containerImage,
        temporaryStorage,
        createNewIfExisting,
        memoryLimit,
        cpuLimit,
      },
      {
        location: this.state.location,
        containerImage: this.state.containerImage,
        temporaryStorage: this.state.temporaryStorage,
        createNewIfExisting: this.state.createNewIfExisting,
        memoryLimit: this.state.memoryLimit,
        cpuLimit: this.state.cpuLimit,
      },
    ) as State;

    this.setState(state);
    this.props.onChange(state.location, state.remotesValidated);
  }

  public render() {
    const { hasSupportedGitService } = this.state;
    const { expanded, remotes, devfilePath, gitBranch } = this.state;
    const { containerImage, temporaryStorage, createNewIfExisting, memoryLimit, cpuLimit } =
      this.state;
    return (
      <Accordion asDefinitionList={false}>
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              this.handleToggle('git-repo-options');
            }}
            isExpanded={expanded.includes('git-repo-options')}
            id="accordion-item-git-repo-options"
            data-testid="accordion-item-git-repo-options"
          >
            Git Repo Options
          </AccordionToggle>

          <AccordionContent
            isHidden={!expanded.includes('git-repo-options')}
            data-testid="options-content"
          >
            <Panel>
              <PanelMain>
                <PanelMainBody>
                  <GitRepoOptions
                    gitBranch={gitBranch}
                    remotes={remotes}
                    devfilePath={devfilePath}
                    hasSupportedGitService={hasSupportedGitService}
                    onChange={(gitBranch, remotes, devfilePath, isValid) =>
                      this.handleGitRepoOptionsChange(gitBranch, remotes, devfilePath, isValid)
                    }
                  />
                </PanelMainBody>
              </PanelMain>
            </Panel>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              this.handleToggle('advanced-options');
            }}
            isExpanded={expanded.includes('advanced-options')}
            id="accordion-item-advanced-options"
            data-testid="accordion-item-advanced-options"
          >
            Advanced Options
          </AccordionToggle>

          <AccordionContent
            isHidden={!expanded.includes('advanced-options')}
            data-testid="options-content"
          >
            <Panel>
              <PanelMain>
                <PanelMainBody>
                  <AdvancedOptions
                    containerImage={containerImage}
                    temporaryStorage={temporaryStorage}
                    createNewIfExisting={createNewIfExisting}
                    memoryLimit={memoryLimit}
                    cpuLimit={cpuLimit}
                    onChange={(
                      containerImage,
                      temporaryStorage,
                      createNewIfExisting,
                      memoryLimit,
                      cpuLimit,
                    ) =>
                      this.handleAdvancedOptionsOptionsChange(
                        containerImage,
                        temporaryStorage,
                        createNewIfExisting,
                        memoryLimit,
                        cpuLimit,
                      )
                    }
                  />
                </PanelMainBody>
              </PanelMain>
            </Panel>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  sshKeys: selectSshKeys(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(RepoOptionsAccordion);
