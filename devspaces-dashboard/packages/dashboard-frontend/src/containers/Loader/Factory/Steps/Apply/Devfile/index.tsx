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

import { V220DevfileProjects, V220DevfileProjectsItemsGit } from '@devfile/api';
import common, { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ExpandableWarning from '../../../../../../components/ExpandableWarning';
import { LoaderPage } from '../../../../../../pages/Loader';
import devfileApi from '../../../../../../services/devfileApi';
import { delay } from '../../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../../services/helpers/disposable';
import { getProjectName } from '../../../../../../services/helpers/getProjectName';
import { buildIdeLoaderLocation } from '../../../../../../services/helpers/location';
import { AlertItem } from '../../../../../../services/helpers/types';
import { Workspace } from '../../../../../../services/workspace-adapter';
import { AppState } from '../../../../../../store';
import { selectDefaultDevfile } from '../../../../../../store/DevfileRegistries/selectors';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../../store/FactoryResolver/selectors';
import { selectDefaultNamespace } from '../../../../../../store/InfrastructureNamespaces/selectors';
import * as WorkspacesStore from '../../../../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../../AbstractStep';
import { buildFactoryParams, FactoryParams } from '../../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_CREATE_SEC } from '../../../../const';
import findTargetWorkspace from '../../../../findTargetWorkspace';
import { getGitRemotes, GitRemote } from './getGitRemotes';
import { getProjectFromUrl } from './getProjectFromUrl';
import { prepareDevfile } from './prepareDevfile';
import { selectDevWorkspaceWarnings } from '../../../../../../store/Workspaces/devWorkspaces/selectors';

export class CreateWorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateWorkspaceError';
  }
}

export type Props = MappedProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  devfile?: devfileApi.Devfile;
  factoryParams: FactoryParams;
  newWorkspaceName?: string;
  shouldCreate: boolean; // should the loader create a workspace
  warning?: string; // the devWorkspace warning to show
};

class StepApplyDevfile extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldCreate: true,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const workspace = this.findTargetWorkspace(this.props, this.state);
    const nextWorkspace = this.findTargetWorkspace(nextProps, nextState);

    // switch to the next step
    if (this.props.currentStepIndex !== nextProps.currentStepIndex) {
      return true;
    }

    // new workspace appeared
    if (workspace === undefined && nextWorkspace !== undefined) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    if (this.state.shouldCreate !== nextState.shouldCreate) {
      return true;
    }

    if (this.state.newWorkspaceName !== nextState.newWorkspaceName) {
      return true;
    }

    // a warning appeared
    if (
      workspace !== undefined &&
      nextWorkspace !== undefined &&
      this.props.devWorkspaceWarnings[workspace.uid] !==
        nextProps.devWorkspaceWarnings[nextWorkspace.uid]
    ) {
      return true;
    }

    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private init() {
    const workspace = this.findTargetWorkspace(this.props, this.state);

    if (workspace) {
      // prevent a workspace being created one more time
      this.setState({
        shouldCreate: false,
      });

      const warning = this.props.devWorkspaceWarnings[workspace.uid];
      if (warning) {
        this.setState({
          warning,
        });
      }
    }

    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.setState({
      shouldCreate: true,
      newWorkspaceName: undefined,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  private updateCurrentDevfile(devfile: devfileApi.Devfile): void {
    const { factoryResolver, allWorkspaces, defaultDevfile } = this.props;
    const { factoryParams } = this.state;
    const { factoryId, policiesCreate, sourceUrl, storageType, remotes } = factoryParams;

    // when using the default devfile instead of a user devfile
    if (factoryResolver === undefined && isEqual(devfile, defaultDevfile)) {
      if (devfile.projects === undefined) {
        devfile.projects = [];
      }
      if (devfile.projects.length === 0) {
        // adds a default project from the source URL
        if (sourceUrl) {
          const project = getProjectFromUrl(factoryParams.sourceUrl);
          devfile.projects[0] = project;
          // change default name
          devfile.metadata.name = project.name;
          devfile.metadata.generateName = project.name;
        }
      }
    }

    if (remotes) {
      this.configureProjectRemotes(devfile, remotes, isEqual(devfile, defaultDevfile));
    }

    // test the devfile name to decide if we need to append a suffix to is
    const nameConflict = allWorkspaces.some(w => devfile.metadata.name === w.name);
    const appendSuffix = policiesCreate === 'perclick' || nameConflict;

    const updatedDevfile = prepareDevfile(devfile, factoryId, storageType, appendSuffix);

    this.setState({
      devfile: updatedDevfile,
      newWorkspaceName: updatedDevfile.metadata.name,
    });
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const {
      factoryResolverConverted,
      factoryResolver,
      defaultDevfile,
      loaderSteps,
      currentStepIndex,
    } = this.props;
    const { shouldCreate, devfile, warning } = this.state;

    if (warning) {
      // update step title
      const currentStep = loaderSteps.get(currentStepIndex).value;
      const newTitle = `Warning: ${warning}`;
      if (newTitle !== currentStep.title) {
        currentStep.title = newTitle;
        currentStep.hasWarning = true;
        this.forceUpdate();
      }
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace !== undefined) {
      // the workspace has been created, go to the next step
      const nextLocation = buildIdeLoaderLocation(workspace);
      this.props.history.location.pathname = nextLocation.pathname;
      this.props.history.location.search = '';
      return true;
    }

    if (shouldCreate === false) {
      if (this.state.lastError instanceof Error) {
        throw this.state.lastError;
      }
      throw new Error('The workspace creation unexpectedly failed.');
    }

    if (devfile === undefined) {
      if (factoryResolver === undefined) {
        const _devfile = defaultDevfile;
        if (_devfile === undefined) {
          throw new Error('Failed to resolve the default devfile.');
        }
        this.updateCurrentDevfile(_devfile);
        return false;
      }
      const _devfile = factoryResolverConverted?.devfileV2;
      if (_devfile === undefined) {
        throw new Error('Failed to resolve the devfile.');
      }
      this.updateCurrentDevfile(_devfile);
      return false;
    }

    try {
      await this.createWorkspaceFromDevfile(devfile);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      throw new CreateWorkspaceError(errorMessage);
    }

    // wait for the workspace creation to complete
    try {
      await this.waitForStepDone(TIMEOUT_TO_CREATE_SEC);

      // do not switch to the next step
      return false;
    } catch (e) {
      throw new Error(
        `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
      );
    }
  }

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    if (state.newWorkspaceName === undefined) {
      return undefined;
    }
    return findTargetWorkspace(props.allWorkspaces, {
      namespace: props.defaultNamespace.name,
      workspaceName: state.newWorkspaceName,
    });
  }

  private async createWorkspaceFromDevfile(devfile: devfileApi.Devfile): Promise<void> {
    const optionalFilesContent = this.props.factoryResolver?.optionalFilesContent || {};
    await this.props.createWorkspaceFromDevfile(
      devfile,
      this.state.factoryParams,
      optionalFilesContent,
    );
  }

  private handleCreateWorkspaceError(): void {
    const { defaultDevfile } = this.props;
    const { devfile } = this.state;
    const _devfile = defaultDevfile;
    if (_devfile && devfile) {
      _devfile.projects = devfile.projects;
      _devfile.metadata.name = devfile.metadata.name;
      _devfile.metadata.generateName = devfile.metadata.generateName;
      this.updateCurrentDevfile(_devfile);
    }
    this.clearStepError();
  }

  private getAlertItem(error: unknown): AlertItem | undefined {
    if (error instanceof CreateWorkspaceError) {
      return {
        key: 'factory-loader-create-workspace-error',
        title: 'Warning',
        variant: AlertVariant.warning,
        children: (
          <ExpandableWarning
            textBefore="The new Workspace couldn't be created from the Devfile in the git repository:"
            errorMessage={helpers.errors.getMessage(error)}
            textAfter="If you continue it will be ignored and a regular workspace will be created.
            You will have a chance to fix the Devfile from the IDE once it is started."
          />
        ),
        actionCallbacks: [
          {
            title: 'Continue with the default devfile',
            callback: () => this.handleCreateWorkspaceError(),
          },
          {
            title: 'Reload',
            callback: () => this.clearStepError(),
          },
        ],
      };
    }
    if (!error) {
      return;
    }
    return {
      key: 'factory-loader-initialize',
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(),
        },
      ],
    };
  }

  private configureProjectRemotes(
    devfile: devfileApi.Devfile,
    remotes: string,
    isDefaultDevfile: boolean,
  ) {
    const parsedRemotes = getGitRemotes(remotes);

    // Determine the remote to set `checkoutFrom.remote` to
    let checkoutRemote = parsedRemotes.find(remote => remote.name === 'origin');
    if (!checkoutRemote) {
      checkoutRemote = parsedRemotes[0];
    }

    // Find the Git project in the devfile to configure remotes for
    let gitProject = this.getGitProjectForConfiguringRemotes(devfile.projects);
    if (!gitProject) {
      if (!devfile.projects) {
        devfile.projects = [];
      }
      devfile.projects[0] = getProjectFromUrl(checkoutRemote.url, checkoutRemote.name);
      gitProject = devfile.projects[0].git;
    } else if (Object.keys(gitProject.remotes).includes('origin')) {
      checkoutRemote = { name: 'origin', url: gitProject.remotes.origin };
    }
    if (gitProject) {
      this.addRemotesToProject(gitProject, checkoutRemote, parsedRemotes);
    } else {
      console.warn('Failed to configure the project remotes.');
    }

    if (isDefaultDevfile) {
      const projectName = getProjectName(checkoutRemote.url);
      devfile.metadata.name = projectName;
      devfile.metadata.generateName = projectName;
    }
  }

  /**
   * Add the remotes specified in `newRemotes` to the `gitProject`.
   * @param gitProject The Git project to add the new remotes to
   * @param checkoutRemote The Git remote to set checkoutFrom.remote to
   * @param newRemotes The array of new Git remotes to add
   */
  private addRemotesToProject(
    gitProject: V220DevfileProjectsItemsGit,
    checkoutRemote: GitRemote,
    newRemotes: GitRemote[],
  ) {
    const gitRemotes = newRemotes.reduce((map, remote) => {
      map[remote.name] = remote.url;
      return map;
    }, {});

    gitProject.remotes = Object.assign(gitProject.remotes, gitRemotes);
    gitProject.checkoutFrom = Object.assign(gitProject.checkoutFrom || {}, {
      remote: checkoutRemote.name,
    });
  }

  /**
   * Returns the Git project to replace remotes for
   */
  private getGitProjectForConfiguringRemotes(projects: V220DevfileProjects[] | undefined) {
    if (!projects) {
      return undefined;
    }

    const gitProjects = projects.filter(project => project.git);
    if (gitProjects.length > 1) {
      throw new Error(
        'Configuring remotes is not supported when multiple Git projects found in Devfile.',
      );
    }

    if (gitProjects.length === 1) {
      return gitProjects[0].git;
    }

    return undefined;
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem = this.getAlertItem(lastError);

    return (
      <LoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        workspace={undefined}
        onTabChange={tab => this.handleTabChange(tab)}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
  defaultDevfile: selectDefaultDevfile(state),
  devWorkspaceWarnings: selectDevWorkspaceWarnings(state),
});

const connector = connect(
  mapStateToProps,
  {
    ...WorkspacesStore.actionCreators,
  },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepApplyDevfile);
