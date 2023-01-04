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
import { connect, ConnectedProps } from 'react-redux';
import { isEqual } from 'lodash';
import { AlertVariant } from '@patternfly/react-core';
import common, { helpers } from '@eclipse-che/common';
import { AppState } from '../../../../../../store';
import * as WorkspacesStore from '../../../../../../store/Workspaces';
import { DisposableCollection } from '../../../../../../services/helpers/disposable';
import { selectAllWorkspaces } from '../../../../../../store/Workspaces/selectors';
import { delay } from '../../../../../../services/helpers/delay';
import devfileApi from '../../../../../../services/devfileApi';
import { FactoryLoaderPage } from '../../../../../../pages/Loader/Factory';
import { selectDefaultNamespace } from '../../../../../../store/InfrastructureNamespaces/selectors';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../../store/FactoryResolver/selectors';
import { prepareDevfile } from './prepareDevfile';
import findTargetWorkspace from '../../../../findTargetWorkspace';
import { buildIdeLoaderLocation } from '../../../../../../services/helpers/location';
import { Workspace } from '../../../../../../services/workspace-adapter';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_CREATE_SEC } from '../../../../const';
import { FactoryParams } from '../../../types';
import buildFactoryParams from '../../../buildFactoryParams';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../../AbstractStep';
import { AlertItem } from '../../../../../../services/helpers/types';
import { selectDefaultDevfile } from '../../../../../../store/DevfileRegistries/selectors';
import ExpandableWarning from '../../../../../../components/ExpandableWarning';
import { getProjectFromUrl } from './getProjectFromUrl';
import { getGitRemotes } from './getGitRemotes';
import { V220DevfileProjects } from '@devfile/api';
import { getProjectName } from '../../../../../../services/helpers/getProjectName';

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

    const { factoryResolverConverted, factoryResolver, defaultDevfile } = this.props;
    const { shouldCreate, devfile } = this.state;

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
    const params = Object.fromEntries(this.props.searchParams);
    const infrastructureNamespace = this.props.defaultNamespace.name;
    const optionalFilesContent = this.props.factoryResolver?.optionalFilesContent || {};
    await this.props.createWorkspaceFromDevfile(
      devfile,
      undefined,
      infrastructureNamespace,
      params,
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
    const gitRemotes = parsedRemotes.reduce((map, remote) => {
      map[remote.name] = remote.url;
      return map;
    }, {});

    const projectName = getProjectName(parsedRemotes[0].url);

    const gitProject = this.getGitProjectForRemotes(devfile.projects);
    if (gitProject) {
      // edit existing Git project remote
      gitProject.remotes = gitRemotes;
      gitProject.checkoutFrom = { remote: parsedRemotes[0].name };
    } else {
      devfile.projects = [
        {
          git: {
            remotes: gitRemotes,
            checkoutFrom: { remote: parsedRemotes[0].name },
          },
          name: projectName,
        },
      ];
    }

    if (isDefaultDevfile) {
      devfile.metadata.name = projectName;
      devfile.metadata.generateName = projectName;
    }
  }

  /**
   * Returns the Git project to replace remotes for
   */
  private getGitProjectForRemotes(projects: V220DevfileProjects[] | undefined) {
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
      <FactoryLoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
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
