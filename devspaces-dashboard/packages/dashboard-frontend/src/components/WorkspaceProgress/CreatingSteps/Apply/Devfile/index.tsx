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

import common, { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import ExpandableWarning from '@/components/ExpandableWarning';
import { TIMEOUT_TO_CREATE_SEC } from '@/components/WorkspaceProgress/const';
import { configureProjectRemotes } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import { getProjectFromLocation } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getProjectFromLocation';
import { prepareDevfile } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/prepareDevfile';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import { lazyInject } from '@/inversify.config';
import devfileApi from '@/services/devfileApi';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import {
  buildFactoryParams,
  FactoryParams,
  USE_DEFAULT_DEVFILE,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { buildIdeLoaderLocation, toHref } from '@/services/helpers/location';
import { AlertItem } from '@/services/helpers/types';
import { TabManager } from '@/services/tabManager';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { selectDefaultDevfile } from '@/store/DevfileRegistries/selectors';
import { selectFactoryResolver } from '@/store/FactoryResolver/selectors';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectDevWorkspaceWarnings } from '@/store/Workspaces/devWorkspaces/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export class CreateWorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateWorkspaceError';
  }
}

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  devfile?: devfileApi.Devfile;
  factoryParams: FactoryParams;
  newWorkspaceName?: string; // a workspace name to create
  shouldCreate: boolean; // should the loader create a workspace
  warning?: string; // the devWorkspace warning to show
  continueWithDefaultDevfile: boolean; //
};

class CreatingStepApplyDevfile extends ProgressStep<Props, State> {
  protected readonly name = 'Generating a DevWorkspace from the Devfile';

  @lazyInject(TabManager)
  private readonly tabManager: TabManager;

  constructor(props: Props) {
    super(props);

    const factoryParams = buildFactoryParams(props.searchParams);
    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldCreate: true,
      name: this.name,
      continueWithDefaultDevfile: factoryParams.useDefaultDevfile,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
      return true;
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);
    const nextWorkspace = this.findTargetWorkspace(nextProps, nextState);

    // devfile changed (when using the default one)
    if (!isEqual(this.state.devfile, nextState.devfile)) {
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
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);

    if (workspace) {
      // prevent a workspace being created one more time
      this.setState({
        shouldCreate: false,
        continueWithDefaultDevfile: false,
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

  private updateCurrentDevfile(devfile: devfileApi.Devfile): void {
    const { factoryResolver, allWorkspaces, defaultDevfile } = this.props;
    const { factoryParams } = this.state;
    const { factoryId, policiesCreate, sourceUrl, storageType, remotes } = factoryParams;

    // when using the default devfile instead of a user devfile
    if (factoryResolver === undefined && isEqual(devfile, defaultDevfile)) {
      if (FactoryLocationAdapter.isSshLocation(factoryParams.sourceUrl)) {
        if (!devfile.attributes) {
          devfile.attributes = {};
        }

        devfile.attributes['controller.devfile.io/bootstrap-devworkspace'] = true;
      }

      if (devfile.projects === undefined) {
        devfile.projects = [];
      }
      if (devfile.projects.length === 0) {
        // adds a default project from the source URL
        if (sourceUrl) {
          const project = getProjectFromLocation(factoryParams.sourceUrl);
          devfile.projects[0] = project;
          // change default name
          devfile.metadata.name = project.name;
          devfile.metadata.generateName = project.name;
        }
      }
    } else if (factoryResolver?.source === 'repo') {
      if (FactoryLocationAdapter.isSshLocation(factoryParams.sourceUrl)) {
        if (!devfile.attributes) {
          devfile.attributes = {};
        }

        devfile.attributes['controller.devfile.io/bootstrap-devworkspace'] = true;
      }
    }

    if (remotes) {
      configureProjectRemotes(devfile, remotes, isEqual(devfile, defaultDevfile));
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
    const { factoryResolver, defaultDevfile } = this.props;
    const { shouldCreate, devfile, warning, continueWithDefaultDevfile } = this.state;

    if (warning) {
      const newName = `Warning: ${warning}`;
      if (this.state.name !== newName) {
        this.setState({
          name: newName,
        });
        this.forceUpdate();
      }
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace !== undefined) {
      // preserve the current active tab
      const tabName = new URLSearchParams(this.props.history.location.search).get('tab');

      // the workspace has been created, go to the next step
      const nextLocation = buildIdeLoaderLocation(workspace);
      this.props.history.location.pathname = nextLocation.pathname;
      this.props.history.location.search = tabName ? `?tab=${tabName}` : '';

      const url = toHref(this.props.history, nextLocation);
      this.tabManager.rename(url);

      return true;
    }

    if (shouldCreate === false) {
      throw new Error('The workspace creation unexpectedly failed.');
    }

    // factory resolving failed in the previous step
    // hence we have to proceed with the default devfile
    if (factoryResolver === undefined) {
      if (devfile === undefined) {
        if (defaultDevfile === undefined) {
          throw new Error('Failed to resolve the default devfile.');
        }
        const _devfile = cloneDeep(defaultDevfile);
        this.updateCurrentDevfile(_devfile);
      } else {
        try {
          await this.createWorkspaceFromDevfile(devfile);
        } catch (e) {
          const errorMessage = common.helpers.errors.getMessage(e);
          throw new CreateWorkspaceError(errorMessage);
        }
      }
      return false;
    }

    // the user devfile is invalid and caused creation error
    // so we have to proceed with the default devfile
    if (continueWithDefaultDevfile === true) {
      if (defaultDevfile === undefined) {
        throw new Error('Failed to resolve the default devfile.');
      }
      if (devfile === undefined) {
        const _devfile = cloneDeep(defaultDevfile);

        if (!_devfile.attributes) {
          _devfile.attributes = {};
        }
        if (factoryResolver?.devfile !== undefined) {
          const { metadata, projects } = factoryResolver.devfile;
          _devfile.projects = projects;
          _devfile.metadata.name = metadata.name;
          _devfile.metadata.generateName = metadata.generateName;
        }

        this.updateCurrentDevfile(_devfile);
        return false;
      }

      // proceed with the default devfile
      try {
        await this.createWorkspaceFromDevfile(devfile);
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        throw new CreateWorkspaceError(errorMessage);
      }
      return false;
    }

    // proceed with the user devfile
    if (devfile === undefined) {
      const resolvedDevfile = factoryResolver?.devfile;
      if (resolvedDevfile === undefined) {
        throw new Error('Failed to resolve the devfile.');
      }
      this.updateCurrentDevfile(resolvedDevfile);
    } else {
      const { devfile } = this.state;
      if (devfile) {
        try {
          await this.createWorkspaceFromDevfile(devfile);
        } catch (e) {
          const errorMessage = common.helpers.errors.getMessage(e);
          throw new CreateWorkspaceError(errorMessage);
        }
      }
    }

    // wait for the workspace creation to complete
    return false;
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

  protected handleRestart(alertKey: string): void {
    const searchParams = new URLSearchParams(this.props.history.location.search);
    searchParams.delete(USE_DEFAULT_DEVFILE);
    this.props.history.location.search = searchParams.toString();
    this.props.onHideError(alertKey);

    this.setState({
      shouldCreate: true,
      newWorkspaceName: undefined,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  private handleContinueWithDefaultDevfile(alertKey: string): void {
    const searchParams = new URLSearchParams(this.props.history.location.search);
    searchParams.set(USE_DEFAULT_DEVFILE, 'true');
    this.props.history.location.search = searchParams.toString();
    this.props.onHideError(alertKey);

    this.setState({
      continueWithDefaultDevfile: true,
      devfile: undefined,
    });
    this.clearStepError();
  }

  protected handleTimeout(): void {
    const timeoutError = new Error(
      `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
    );
    this.handleError(timeoutError);
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;

    if (error instanceof CreateWorkspaceError) {
      return {
        key,
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
            title: 'Continue with default devfile',
            callback: () => this.handleContinueWithDefaultDevfile(key),
          },
          {
            title: 'Reload',
            callback: () => this.handleRestart(key),
          },
        ],
      };
    }
    return {
      key,
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Continue with default devfile',
          callback: () => this.handleContinueWithDefaultDevfile(key),
        },
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(key),
        },
      ],
    };
  }

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name, lastError, warning } = this.state;

    const isActive = distance === 0;
    const isError = false;
    const isWarning = warning !== undefined || lastError !== undefined;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={TIMEOUT_TO_CREATE_SEC} onTimeout={() => this.handleTimeout()} />
        )}
        <ProgressStepTitle
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  factoryResolver: selectFactoryResolver(state),
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
export default connector(CreatingStepApplyDevfile);
